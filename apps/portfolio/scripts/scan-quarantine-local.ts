import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { and, eq } from "drizzle-orm";

import { createDb } from "../db/client";
import { auditEvents, mediaAssets } from "../db/schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const wrangler = path.join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const persistencePath = path.join(projectRoot, ".wrangler", "state");
const workerConfig = path.join(projectRoot, "dist", "server", "wrangler.json");
const bucketName = "site-creator-r2";
const db = createDb(databaseUrl);
const remoteMode = process.argv.includes("--remote");
if (remoteMode && process.env.ALLOW_REMOTE_DOCUMENT_SCAN !== "confirmed") {
  throw new Error("Remote scanning requires ALLOW_REMOTE_DOCUMENT_SCAN=confirmed.");
}

type CommandResult = { code: number | null; stdout: string; stderr: string };

function run(command: string, args: string[], timeoutMs = 120_000): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Scanner command timed out."));
    }, timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

async function findDefenderExecutable() {
  const programData = process.env.ProgramData ?? "C:\\ProgramData";
  const platformRoot = path.join(programData, "Microsoft", "Windows Defender", "Platform");
  try {
    const versions = (await readdir(platformRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
    for (const version of versions) {
      const candidate = path.join(platformRoot, version, "MpCmdRun.exe");
      try {
        await access(candidate);
        return candidate;
      } catch {
        // Try the next installed platform version.
      }
    }
  } catch {
    // Fall through to the inbox Defender location.
  }
  return path.join(
    process.env.ProgramFiles ?? "C:\\Program Files",
    "Windows Defender",
    "MpCmdRun.exe",
  );
}

async function verifyDefenderHealth() {
  const command = [
    "$status = Get-MpComputerStatus | Select-Object AntivirusEnabled,AntivirusSignatureVersion,AntivirusSignatureLastUpdated;",
    "$status | ConvertTo-Json -Compress",
  ].join(" ");
  const result = await run("powershell.exe", ["-NoProfile", "-Command", command], 30_000);
  if (result.code !== 0) throw new Error("Microsoft Defender status could not be verified.");
  const status = JSON.parse(result.stdout.trim()) as {
    AntivirusEnabled?: boolean;
    AntivirusSignatureVersion?: string;
    AntivirusSignatureLastUpdated?: string;
  };
  if (!status.AntivirusEnabled) throw new Error("Microsoft Defender Antivirus is not enabled.");
  const rawUpdatedAt = status.AntivirusSignatureLastUpdated ?? "";
  const powershellTimestamp = /^\/Date\((\d+)(?:[+-]\d+)?\)\/$/.exec(rawUpdatedAt);
  const updatedAt = powershellTimestamp
    ? new Date(Number(powershellTimestamp[1]))
    : new Date(rawUpdatedAt);
  if (
    !Number.isFinite(updatedAt.getTime()) ||
    Date.now() - updatedAt.getTime() > 72 * 60 * 60 * 1000
  ) {
    throw new Error("Microsoft Defender signatures are missing or older than 72 hours.");
  }
  return {
    provider: "microsoft-defender",
    signatureVersion: status.AntivirusSignatureVersion ?? "unknown",
    signatureUpdatedAt: updatedAt.toISOString(),
  };
}

function safeTemporaryDirectory(target: string) {
  const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(target));
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

const defender = await findDefenderExecutable();
const scanner = await verifyDefenderHealth();
const pendingAssets = await db
  .select({
    id: mediaAssets.id,
    objectKey: mediaAssets.objectKey,
    sha256: mediaAssets.sha256,
  })
  .from(mediaAssets)
  .where(and(eq(mediaAssets.storageClass, "quarantine"), eq(mediaAssets.scanStatus, "pending")));

const results: Array<{ id: string; status: "clean" | "pending" }> = [];
for (const asset of pendingAssets) {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "portfolio-scan-"));
  const temporaryFile = path.join(temporaryDirectory, `${randomUUID()}.pdf`);
  try {
    await mkdir(persistencePath, { recursive: true });
    const downloadArguments = [
      wrangler,
      "r2",
      "object",
      "get",
      `${bucketName}/${asset.objectKey}`,
      "--file",
      temporaryFile,
      "--config",
      workerConfig,
      ...(remoteMode ? ["--remote"] : ["--local", "--persist-to", persistencePath]),
    ];
    const download = await run(process.execPath, downloadArguments);
    if (download.code !== 0) throw new Error(`Could not read quarantined object ${asset.id}.`);

    const bytes = await readFile(temporaryFile);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (sha256 !== asset.sha256)
      throw new Error(`Checksum mismatch for quarantined object ${asset.id}.`);

    const scan = await run(defender, [
      "-Scan",
      "-ScanType",
      "3",
      "-File",
      temporaryFile,
      "-DisableRemediation",
    ]);
    if (scan.code !== 0) {
      results.push({ id: asset.id, status: "pending" });
      continue;
    }

    await db.update(mediaAssets).set({ scanStatus: "clean" }).where(eq(mediaAssets.id, asset.id));
    try {
      await db.insert(auditEvents).values({
        action: "document.scan.clean",
        targetType: "media_asset",
        targetId: asset.id,
        correlationId: randomUUID(),
        metadata: {
          provider: scanner.provider,
          signatureVersion: scanner.signatureVersion,
          signatureUpdatedAt: scanner.signatureUpdatedAt,
          checksumVerified: "true",
          storageMode: remoteMode ? "remote" : "local",
        },
      });
    } catch (error) {
      await db
        .update(mediaAssets)
        .set({ scanStatus: "pending" })
        .where(eq(mediaAssets.id, asset.id));
      throw error;
    }
    results.push({ id: asset.id, status: "clean" });
  } finally {
    if (!safeTemporaryDirectory(temporaryDirectory)) {
      throw new Error("Refusing to remove an unsafe temporary path.");
    }
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

console.log(
  JSON.stringify({
    scanner: scanner.provider,
    storageMode: remoteMode ? "remote" : "local",
    signatureVersion: scanner.signatureVersion,
    scanned: results.length,
    clean: results.filter((result) => result.status === "clean").length,
    pending: results.filter((result) => result.status === "pending").length,
    results,
  }),
);

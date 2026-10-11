import { copyFileSync, existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceEnvironment = path.join(projectRoot, ".env");
const workerEnvironment = path.join(projectRoot, "dist/server/.dev.vars");
const wrangler = path.join(projectRoot, "node_modules/wrangler/bin/wrangler.js");
const sitesEnvironment = path.join(projectRoot, "scripts/sites-env.mjs");

if (!existsSync(sourceEnvironment)) {
  throw new Error(
    "The ignored local .env file is required before starting the database-backed Worker.",
  );
}

copyFileSync(sourceEnvironment, workerEnvironment);

const child = spawn(
  process.execPath,
  [
    "--import",
    pathToFileURL(sitesEnvironment).href,
    wrangler,
    "dev",
    "--config",
    "dist/server/wrangler.json",
    "--local",
    "--persist-to",
    ".wrangler/state",
    "--ip",
    "127.0.0.1",
    "--inspector-port",
    "0",
    ...process.argv.slice(2),
  ],
  { cwd: projectRoot, stdio: "inherit" },
);

function cleanup() {
  rmSync(workerEnvironment, { force: true });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
    cleanup();
    process.exit(0);
  });
}

child.on("error", (error) => {
  cleanup();
  throw error;
});

child.on("exit", (code, signal) => {
  cleanup();
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});

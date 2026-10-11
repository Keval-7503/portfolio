export const MAX_PDF_BYTES = 5 * 1024 * 1024;

const SAFE_FILENAME_CHARACTERS = /[^a-zA-Z0-9._-]+/g;
const ACTIVE_PDF_MARKERS = ["/JavaScript", "/JS", "/Launch", "/EmbeddedFile", "/OpenAction"];

export type ValidatedPdf = {
  bytes: Uint8Array;
  safeFilename: string;
  detectedMediaType: "application/pdf";
  sha256: string;
};

export class UploadPolicyError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "UploadPolicyError";
  }
}

function safePdfFilename(filename: string) {
  const base = filename.replaceAll("\\", "/").split("/").pop()?.trim() ?? "document.pdf";
  const normalized = base
    .normalize("NFKC")
    .replace(SAFE_FILENAME_CHARACTERS, "-")
    .replace(/-+/g, "-");
  const stem = normalized
    .replace(/\.pdf$/i, "")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${stem || "document"}.pdf`;
}

export async function validatePdfUpload(input: {
  filename: string;
  declaredMediaType: string;
  bytes: Uint8Array;
}): Promise<ValidatedPdf> {
  if (!input.filename.toLowerCase().endsWith(".pdf"))
    throw new UploadPolicyError("EXTENSION_NOT_ALLOWED");
  if (input.declaredMediaType.toLowerCase() !== "application/pdf")
    throw new UploadPolicyError("MEDIA_TYPE_MISMATCH");
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_PDF_BYTES)
    throw new UploadPolicyError("SIZE_NOT_ALLOWED");

  const header = new TextDecoder("ascii").decode(input.bytes.slice(0, 8));
  if (!header.startsWith("%PDF-")) throw new UploadPolicyError("SIGNATURE_MISMATCH");
  const trailer = new TextDecoder("ascii").decode(input.bytes.slice(-1024));
  if (!trailer.includes("%%EOF")) throw new UploadPolicyError("TRUNCATED_PDF");

  const searchable = new TextDecoder("latin1").decode(input.bytes);
  if (ACTIVE_PDF_MARKERS.some((marker) => searchable.includes(marker))) {
    throw new UploadPolicyError("ACTIVE_CONTENT_REJECTED");
  }

  const digestBytes = new Uint8Array(input.bytes.byteLength);
  digestBytes.set(input.bytes);
  const digest = await crypto.subtle.digest("SHA-256", digestBytes.buffer);
  const sha256 = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return {
    bytes: input.bytes,
    safeFilename: safePdfFilename(input.filename),
    detectedMediaType: "application/pdf",
    sha256,
  };
}

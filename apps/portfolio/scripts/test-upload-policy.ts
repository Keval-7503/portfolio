import assert from "node:assert/strict";

import { MAX_PDF_BYTES, UploadPolicyError, validatePdfUpload } from "../lib/uploads/pdf-policy";

const bytes = (value: string) => new TextEncoder().encode(value);
const validPdf = bytes("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");

const accepted = await validatePdfUpload({
  filename: "../Reviewed Résumé 2026.pdf",
  declaredMediaType: "application/pdf",
  bytes: validPdf,
});
assert.equal(accepted.safeFilename, "Reviewed-R-sum-2026.pdf");
assert.match(accepted.sha256, /^[0-9a-f]{64}$/);

async function rejects(code: string, input: Parameters<typeof validatePdfUpload>[0]) {
  await assert.rejects(
    () => validatePdfUpload(input),
    (error: unknown) => {
      return error instanceof UploadPolicyError && error.code === code;
    },
  );
}

await rejects("EXTENSION_NOT_ALLOWED", {
  filename: "document.exe",
  declaredMediaType: "application/pdf",
  bytes: validPdf,
});
await rejects("MEDIA_TYPE_MISMATCH", {
  filename: "document.pdf",
  declaredMediaType: "text/html",
  bytes: validPdf,
});
await rejects("SIGNATURE_MISMATCH", {
  filename: "document.pdf",
  declaredMediaType: "application/pdf",
  bytes: bytes("MZ executable\n%%EOF"),
});
await rejects("TRUNCATED_PDF", {
  filename: "document.pdf",
  declaredMediaType: "application/pdf",
  bytes: bytes("%PDF-1.7 without trailer"),
});
await rejects("ACTIVE_CONTENT_REJECTED", {
  filename: "document.pdf",
  declaredMediaType: "application/pdf",
  bytes: bytes("%PDF-1.7\n/OpenAction 1 0 R\n%%EOF"),
});
await rejects("SIZE_NOT_ALLOWED", {
  filename: "document.pdf",
  declaredMediaType: "application/pdf",
  bytes: new Uint8Array(MAX_PDF_BYTES + 1),
});

console.log(
  "PDF size, extension, media type, signature, active-content, filename, and digest checks passed.",
);

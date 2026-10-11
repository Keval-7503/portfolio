import { getAuthorizedAdmin } from "@/lib/auth/policy";
import { registerQuarantinedDocument } from "@/lib/documents/registration";
import { getAuthEnvironment } from "@/lib/env";
import { logEvent } from "@/lib/observability/logger";
import { getRequestId, responseHeaders } from "@/lib/observability/request-id";
import { hasTrustedMutationOrigin } from "@/lib/security/request";
import { MAX_PDF_BYTES, UploadPolicyError, validatePdfUpload } from "@/lib/uploads/pdf-policy";
import { deleteQuarantinedAsset, quarantinePdf } from "@/lib/uploads/storage";
import { z } from "zod";

export const dynamic = "force-dynamic";

const registrationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("resume"), label: z.string().trim().min(1).max(100) }),
  z.object({
    kind: z.literal("private_document"),
    label: z.string().trim().min(1).max(100),
    documentType: z.enum(["transcript", "reference", "other"]),
  }),
]);

function json(body: unknown, status: number, requestId: string) {
  return Response.json(body, {
    status,
    headers: { ...responseHeaders(requestId), "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request.headers);
  const environment = getAuthEnvironment();
  if (!hasTrustedMutationOrigin(request, environment.APP_ORIGIN))
    return json({ error: "untrusted_origin" }, 403, requestId);
  const authorization = await getAuthorizedAdmin(request.headers, { requireFresh: true });
  if (!authorization) return json({ error: "reauthentication_required" }, 401, requestId);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_PDF_BYTES + 64 * 1024)
    return json({ error: "payload_too_large" }, 413, requestId);

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "file_required" }, 400, requestId);
    const registration = registrationSchema.safeParse({
      kind: form.get("kind"),
      label: form.get("label"),
      documentType: form.get("documentType") ?? undefined,
    });
    if (!registration.success) return json({ error: "invalid_document_metadata" }, 400, requestId);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validated = await validatePdfUpload({
      filename: file.name,
      declaredMediaType: file.type,
      bytes,
    });
    const asset = await quarantinePdf({
      file: validated,
      originalFilename: file.name,
      declaredMediaType: file.type,
      actorAuthUserId: authorization.session.user.id,
    });
    try {
      await registerQuarantinedDocument(asset.id, asset.safeFilename, registration.data);
    } catch (error) {
      await deleteQuarantinedAsset(asset.id).catch(() => undefined);
      throw error;
    }
    logEvent("info", "upload.quarantined", {
      requestId,
      actorId: authorization.session.user.id,
      targetId: asset.id,
      targetType: "media_asset",
      outcome: "quarantined",
      byteSize: bytes.byteLength,
    });
    return json(
      { status: "quarantined", id: asset.id, scanStatus: asset.scanStatus },
      201,
      requestId,
    );
  } catch (error) {
    if (error instanceof UploadPolicyError) return json({ error: error.code }, 400, requestId);
    logEvent("error", "upload.failed", {
      requestId,
      outcome: "failed",
      errorCode: "UPLOAD_FAILED",
    });
    return json({ error: "upload_failed" }, 503, requestId);
  }
}

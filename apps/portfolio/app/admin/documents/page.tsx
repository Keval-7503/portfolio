import { requireAdmin } from "@/lib/auth/policy";
import { FullPageLink } from "@/components/full-page-link";
import { listActiveUploads } from "@/lib/uploads/admin";
import { DeleteUploadButton, PromoteUploadButton, UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requireAdmin();
  const uploads = await listActiveUploads();
  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            <span />
            Private storage
          </p>
          <h1>Documents</h1>
          <p className="admin-owner">
            Every new file remains quarantined until an approved scanner marks it clean.
          </p>
        </div>
        <FullPageLink className="button button-secondary" href="/admin">
          Back to admin
        </FullPageLink>
      </header>
      <section className="admin-card admin-editor-card" aria-labelledby="upload-title">
        <h2 id="upload-title">Upload a PDF</h2>
        <p>
          PDF signature, media type, extension, size, active-content markers, and safe filename are
          checked before private storage.
        </p>
        <UploadForm />
      </section>
      <section
        className="admin-card admin-editor-card admin-revisions"
        aria-labelledby="document-inventory-title"
      >
        <h2 id="document-inventory-title">Document inventory</h2>
        {uploads.length === 0 ? (
          <p>No documents are stored.</p>
        ) : (
          <div className="revision-list">
            {uploads.map((asset) => (
              <div key={asset.id}>
                <span>
                  <strong>{asset.resumeLabel ?? asset.privateLabel ?? asset.safeFilename}</strong>
                  <small>
                    {asset.byteSize.toLocaleString()} bytes · {asset.storageClass} · scan{" "}
                    {asset.scanStatus}
                  </small>
                  <small>{asset.createdAt.toLocaleString()}</small>
                </span>
                <span className="admin-edit-actions">
                  {asset.storageClass === "quarantine" && asset.scanStatus === "clean" ? (
                    <PromoteUploadButton
                      action={asset.resumeLabel ? "publish_resume" : "accept_private"}
                      id={asset.id}
                    />
                  ) : null}
                  <DeleteUploadButton
                    id={asset.id}
                    label={
                      asset.storageClass === "quarantine"
                        ? "quarantined upload"
                        : asset.resumeVersionId
                          ? "public résumé"
                          : "private document"
                    }
                  />
                  {asset.storageClass === "private" && asset.privateDocumentId ? (
                    <FullPageLink
                      className="button button-secondary"
                      href={`/api/admin/documents/${asset.privateDocumentId}/download`}
                    >
                      Download privately
                    </FullPageLink>
                  ) : null}
                  {asset.storageClass === "public" && asset.resumeVersionId ? (
                    <FullPageLink
                      className="button button-secondary"
                      href="/api/resume/current"
                      target="_blank"
                    >
                      Preview public résumé
                    </FullPageLink>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

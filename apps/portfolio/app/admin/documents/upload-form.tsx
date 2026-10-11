"use client";

import { FormEvent, useState } from "react";

export function UploadForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setMessage(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: new FormData(form),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (body?.error === "reauthentication_required") {
          sessionStorage.setItem("adminReturnTo", "/admin/documents");
          window.location.assign("/admin/reauthenticate?returnTo=%2Fadmin%2Fdocuments");
          return;
        }
        setMessage("The PDF was rejected or storage is unavailable.");
      } else {
        form.reset();
        setMessage("PDF stored in quarantine. It is not public or available for AI processing.");
        window.location.reload();
      }
    } catch {
      setMessage("The upload did not finish. Check the local server and try again.");
    } finally {
      window.clearTimeout(timeout);
      setPending(false);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={submit}>
      <label>
        Document purpose
        <select defaultValue="resume" name="kind">
          <option value="resume">Résumé version</option>
          <option value="private_document">Private document</option>
        </select>
      </label>
      <label>
        Owner label
        <input
          maxLength={100}
          name="label"
          placeholder="Reviewed résumé or transcript label"
          required
        />
      </label>
      <label>
        Private document type (ignored for résumés)
        <select defaultValue="other" name="documentType">
          <option value="transcript">Transcript</option>
          <option value="reference">Reference</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        PDF file (maximum 5 MB)
        <input accept="application/pdf,.pdf" name="file" required type="file" />
      </label>
      <div className="admin-edit-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Validating…" : "Upload to quarantine"}
        </button>
      </div>
      {message ? <p aria-live="polite">{message}</p> : null}
    </form>
  );
}

export function DeleteUploadButton({
  id,
  label,
}: {
  id: string;
  label: "quarantined upload" | "private document" | "public résumé";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span>
      <button
        className="button button-secondary"
        disabled={pending}
        onClick={async () => {
          if (!window.confirm(`Permanently delete this ${label}? This cannot be undone.`)) return;
          setPending(true);
          setError(null);
          try {
            const response = await fetch(`/api/admin/uploads/${id}`, { method: "DELETE" });
            if (response.status === 401) {
              sessionStorage.setItem("adminReturnTo", "/admin/documents");
              window.location.assign("/admin/reauthenticate?returnTo=%2Fadmin%2Fdocuments");
              return;
            }
            if (!response.ok) throw new Error("deletion_failed");
            window.location.reload();
          } catch {
            setError("Deletion failed. Access remains restricted.");
            setPending(false);
          }
        }}
        type="button"
      >
        {pending ? "Deleting…" : "Delete permanently"}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </span>
  );
}

export function PromoteUploadButton({
  id,
  action,
}: {
  id: string;
  action: "accept_private" | "publish_resume";
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span>
      <button
        className="button button-primary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch(`/api/admin/uploads/${id}/promote`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            });
            if (response.status === 401) {
              sessionStorage.setItem("adminReturnTo", "/admin/documents");
              window.location.assign("/admin/reauthenticate?returnTo=%2Fadmin%2Fdocuments");
              return;
            }
            if (!response.ok) throw new Error("promotion_failed");
            window.location.reload();
          } catch {
            setError("Promotion failed. The file remains quarantined.");
            setPending(false);
          }
        }}
        type="button"
      >
        {pending
          ? "Promoting…"
          : action === "publish_resume"
            ? "Publish as current résumé"
            : "Move to private vault"}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </span>
  );
}

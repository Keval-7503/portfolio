"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Revision = { id: string; reason: string; createdAt: string };

export function RevisionHistory({
  projectId,
  revisions,
}: {
  projectId: string;
  revisions: Revision[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (revisions.length === 0) return <p>No saved revisions yet.</p>;

  return (
    <div className="revision-list">
      {revisions.map((revision) => (
        <div key={revision.id}>
          <span>
            <strong>{revision.reason.replaceAll("_", " ")}</strong>
            <small>{new Date(revision.createdAt).toLocaleString()}</small>
          </span>
          <button
            className="auth-text-button"
            disabled={pending !== null}
            onClick={async () => {
              if (!window.confirm("Restore this version? The current version will be saved first."))
                return;
              setPending(revision.id);
              setError(null);
              const response = await fetch(
                `/api/admin/projects/${projectId}/revisions/${revision.id}/restore`,
                { method: "POST" },
              );
              if (!response.ok) {
                setError("This revision could not be restored.");
                setPending(null);
                return;
              }
              router.refresh();
              setPending(null);
            }}
            type="button"
          >
            {pending === revision.id ? "Restoring…" : "Restore"}
          </button>
        </div>
      ))}
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

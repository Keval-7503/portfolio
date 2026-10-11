"use client";

import { useState } from "react";

export function InboxActions({ id, status }: { id: string; status: "new" | "read" | "archived" }) {
  const [pending, setPending] = useState(false);
  async function update(nextStatus: "read" | "archived" | "new") {
    setPending(true);
    const response = await fetch(`/api/admin/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) window.location.reload();
    else setPending(false);
  }
  return (
    <span className="admin-edit-actions">
      {status === "new" ? (
        <button
          className="auth-text-button"
          disabled={pending}
          onClick={() => update("read")}
          type="button"
        >
          Mark read
        </button>
      ) : null}
      {status === "archived" ? (
        <button
          className="auth-text-button"
          disabled={pending}
          onClick={() => update("new")}
          type="button"
        >
          Restore
        </button>
      ) : (
        <button
          className="auth-text-button"
          disabled={pending}
          onClick={() => update("archived")}
          type="button"
        >
          Archive
        </button>
      )}
    </span>
  );
}

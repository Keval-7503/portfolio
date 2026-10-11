"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

type SessionSummary = {
  id: string;
  current: boolean;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export function SessionManager({ sessions }: { sessions: SessionSummary[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function revokeOthers() {
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/sessions/others", { method: "DELETE" });
    if (!response.ok) {
      setMessage("Other sessions could not be revoked. Sign in again and retry.");
    } else {
      setMessage("All other sessions were revoked.");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <>
      <div className="revision-list" aria-label="Active sessions">
        {sessions.map((session) => (
          <div key={session.id}>
            <span>
              <strong>{session.current ? "This device" : "Other device"}</strong>
              <small>{session.userAgent ?? "Unknown browser"}</small>
              <small>
                Created {new Date(session.createdAt).toLocaleString()} · expires{" "}
                {new Date(session.expiresAt).toLocaleString()}
              </small>
            </span>
            <span>{session.ipAddress ?? "IP unavailable"}</span>
          </div>
        ))}
      </div>
      <div className="admin-edit-actions">
        <button
          className="button button-secondary"
          disabled={pending || sessions.length < 2}
          onClick={revokeOthers}
          type="button"
        >
          {pending ? "Revoking…" : "Sign out other devices"}
        </button>
      </div>
      {message ? <p aria-live="polite">{message}</p> : null}
    </>
  );
}

export function ChangePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = String(values.get("currentPassword") ?? "");
    const newPassword = String(values.get("newPassword") ?? "");
    setPending(true);
    setMessage(null);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (result.error) {
      setMessage(
        "Password was not changed. Check the current password and sign in again if required.",
      );
    } else {
      form.reset();
      setMessage("Password changed and all other sessions were revoked.");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form className="admin-edit-form" onSubmit={submit}>
      <label>
        Current password
        <input
          autoComplete="current-password"
          minLength={12}
          name="currentPassword"
          required
          type="password"
        />
      </label>
      <label>
        New password
        <input
          autoComplete="new-password"
          minLength={12}
          name="newPassword"
          required
          type="password"
        />
      </label>
      <div className="admin-edit-actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
      {message ? <p aria-live="polite">{message}</p> : null}
    </form>
  );
}

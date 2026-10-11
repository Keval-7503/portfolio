"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { safeAdminReturnPath } from "@/lib/auth/return-path";

export function TwoFactorForm() {
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const code = String(form.get("code") ?? "").trim();
    const result =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code, trustDevice: false })
        : await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false });

    if (result.error) {
      setError("That code was not accepted. Try again or use a backup code.");
      setPending(false);
      return;
    }
    const destination = safeAdminReturnPath(sessionStorage.getItem("adminReturnTo"));
    sessionStorage.removeItem("adminReturnTo");
    window.location.assign(destination);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        {mode === "totp" ? "6-digit authenticator code" : "Backup code"}
        <input
          autoComplete={mode === "totp" ? "one-time-code" : "off"}
          inputMode={mode === "totp" ? "numeric" : "text"}
          name="code"
          required
        />
      </label>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Verifying…" : "Verify"}
      </button>
      <button
        className="auth-text-button"
        onClick={() => setMode(mode === "totp" ? "backup" : "totp")}
        type="button"
      >
        {mode === "totp" ? "Use a backup code" : "Use authenticator code"}
      </button>
    </form>
  );
}

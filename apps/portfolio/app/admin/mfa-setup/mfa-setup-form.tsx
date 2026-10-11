"use client";

import { FormEvent, useMemo, useState } from "react";

import { FullPageLink } from "@/components/full-page-link";
import { authClient } from "@/lib/auth/client";

type Enrollment = { totpURI: string; backupCodes: string[] };

export function MfaSetupForm() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const secret = useMemo(() => {
    if (!enrollment) return null;
    try {
      return new URL(enrollment.totpURI).searchParams.get("secret");
    } catch {
      return null;
    }
  }, [enrollment]);

  async function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    const result = await authClient.twoFactor.enable({
      password,
      method: "totp",
      issuer: "Keval Patel Portfolio",
    });
    if (result.error || !result.data || result.data.method !== "totp") {
      setError("MFA setup could not start. Check your password and try again.");
      setPending(false);
      return;
    }
    setEnrollment({ totpURI: result.data.totpURI, backupCodes: result.data.backupCodes });
    setPending(false);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    if (result.error) {
      setError("That code was not accepted. Wait for a new code and try again.");
      setPending(false);
      return;
    }
    setVerified(true);
    setPending(false);
  }

  if (verified && enrollment) {
    return (
      <div className="auth-form" aria-live="polite">
        <p className="auth-success">
          MFA is active. Save these one-use recovery codes somewhere private.
        </p>
        <ul className="backup-codes">
          {enrollment.backupCodes.map((code) => (
            <li key={code}>
              <code>{code}</code>
            </li>
          ))}
        </ul>
        <FullPageLink className="button button-primary" href="/admin">
          I saved them
        </FullPageLink>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <form className="auth-form" onSubmit={begin}>
        <label>
          Confirm your password
          <input
            autoComplete="current-password"
            minLength={12}
            name="password"
            required
            type="password"
          />
        </label>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button button-primary" disabled={pending} type="submit">
          {pending ? "Preparing…" : "Set up authenticator"}
        </button>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={verify}>
      <p>Add an account manually in your authenticator app using this secret:</p>
      <code className="totp-secret">{secret ?? "Setup secret unavailable"}</code>
      <label>
        Enter the 6-digit code
        <input autoComplete="one-time-code" inputMode="numeric" name="code" required />
      </label>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Verifying…" : "Activate MFA"}
      </button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth/client";
import { safeAdminReturnPath } from "@/lib/auth/return-path";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const destination = safeAdminReturnPath(returnTo);
    sessionStorage.setItem("adminReturnTo", destination);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      callbackURL: destination,
    });
    if (result.error) {
      setError("Sign-in failed. Check your details and try again.");
      setPending(false);
      return;
    }
    if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
      return;
    }
    window.location.assign(destination);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Email
        <input autoComplete="username" inputMode="email" name="email" required type="email" />
      </label>
      <label>
        Password
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
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";

export function ContactForm({
  failureMessage = "The message could not be sent. Please try again later.",
  successMessage = "Message received. Thank you.",
  turnstileSiteKey,
  nonce,
}: {
  failureMessage?: string;
  successMessage?: string;
  turnstileSiteKey?: string;
  nonce?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("contact_failed");
      form.reset();
      setMessage(successMessage);
    } catch {
      setMessage(failureMessage);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      {turnstileSiteKey ? (
        <script
          async
          defer
          nonce={nonce}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        />
      ) : null}
      <label>
        Name
        <input maxLength={120} name="name" required />
      </label>
      <label>
        Email
        <input inputMode="email" maxLength={254} name="email" required type="email" />
      </label>
      <label>
        Subject
        <input maxLength={160} name="subject" required />
      </label>
      <label>
        Message
        <textarea maxLength={5000} minLength={10} name="message" required rows={8} />
      </label>
      <label hidden>
        Website
        <input autoComplete="off" name="website" tabIndex={-1} />
      </label>
      {turnstileSiteKey ? <div className="cf-turnstile" data-sitekey={turnstileSiteKey} /> : null}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send message"}
      </button>
      {message ? <p aria-live="polite">{message}</p> : null}
    </form>
  );
}

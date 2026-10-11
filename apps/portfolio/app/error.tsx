"use client";

import { FullPageLink } from "@/components/full-page-link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="error-title">
        <p className="eyebrow">
          <span />
          Temporary problem
        </p>
        <h1 id="error-title">This page could not load.</h1>
        <p>No private diagnostic details are shown. Try again, or return to the portfolio.</p>
        <div className="admin-edit-actions">
          <button className="button button-primary" onClick={reset} type="button">
            Try again
          </button>
          <FullPageLink className="button button-secondary" href="/">
            Return home
          </FullPageLink>
        </div>
      </section>
    </main>
  );
}

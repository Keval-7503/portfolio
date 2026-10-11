"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="auth-shell">
          <section className="auth-card" aria-labelledby="global-error-title">
            <h1 id="global-error-title">The portfolio is temporarily unavailable.</h1>
            <p>Please retry. Diagnostic details are kept private.</p>
            <button className="button button-primary" onClick={reset} type="button">
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

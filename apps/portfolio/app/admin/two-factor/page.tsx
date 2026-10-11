import { TwoFactorForm } from "./two-factor-form";

export const dynamic = "force-dynamic";

export default function TwoFactorPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="two-factor-title">
        <p className="eyebrow">
          <span />
          Second step
        </p>
        <h1 id="two-factor-title">Verify it’s you</h1>
        <p>Enter the current code from your authenticator app. Codes are never logged.</p>
        <TwoFactorForm />
      </section>
    </main>
  );
}

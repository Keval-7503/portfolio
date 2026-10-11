import { FullPageLink } from "@/components/full-page-link";
import { requireAdmin } from "@/lib/auth/policy";
import { MfaSetupForm } from "./mfa-setup-form";

export const dynamic = "force-dynamic";

export default async function MfaSetupPage() {
  const { session } = await requireAdmin({ requireMfa: false });
  if (session.user.twoFactorEnabled) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>MFA is active</h1>
          <FullPageLink className="button button-primary" href="/admin">
            Open admin
          </FullPageLink>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="mfa-title">
        <p className="eyebrow">
          <span />
          Required protection
        </p>
        <h1 id="mfa-title">Set up MFA</h1>
        <p>
          Use an authenticator app such as Google Authenticator, Microsoft Authenticator, or 2FAS.
        </p>
        <MfaSetupForm />
      </section>
    </main>
  );
}

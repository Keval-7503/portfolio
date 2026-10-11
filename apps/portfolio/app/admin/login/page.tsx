import { FullPageLink } from "@/components/full-page-link";
import { safeAdminReturnPath } from "@/lib/auth/return-path";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const destination = safeAdminReturnPath(returnTo);

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">
          <span />
          Private workspace
        </p>
        <h1 id="login-title">Owner sign-in</h1>
        <p>
          Enter the owner email and password. You will enter your authenticator code on the next
          screen.
        </p>
        <LoginForm returnTo={destination} />
        <FullPageLink className="auth-back" href="/">
          Return to portfolio
        </FullPageLink>
      </section>
    </main>
  );
}

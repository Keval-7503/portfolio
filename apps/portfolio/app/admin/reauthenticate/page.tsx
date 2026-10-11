import { FullPageLink } from "@/components/full-page-link";
import { safeAdminReturnPath } from "@/lib/auth/return-path";

import { ReauthenticateButton } from "./reauthenticate-button";

export const dynamic = "force-dynamic";

export default async function ReauthenticatePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const destination = safeAdminReturnPath(returnTo);

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="reauthenticate-title">
        <p className="eyebrow">
          <span />
          Recent sign-in required
        </p>
        <h1 id="reauthenticate-title">Verify again</h1>
        <p>
          Your session remains valid, but security controls require a new password and MFA sign-in.
        </p>
        <div className="admin-edit-actions">
          <ReauthenticateButton returnTo={destination} />
          <FullPageLink className="button button-secondary" href={destination}>
            Cancel
          </FullPageLink>
        </div>
      </section>
    </main>
  );
}

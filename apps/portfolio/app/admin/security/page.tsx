import { getDb } from "@/db";
import { requireAdmin } from "@/lib/auth/policy";
import { FullPageLink } from "@/components/full-page-link";
import { listActiveAdminSessions } from "@/lib/auth/session-security";
import { ChangePasswordForm, SessionManager } from "./session-manager";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const { session } = await requireAdmin({ requireFresh: true });
  const activeSessions = await listActiveAdminSessions(getDb(), session.user.id);

  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            <span />
            Account security
          </p>
          <h1>Sessions</h1>
          <p className="admin-owner">Sensitive actions require a recent sign-in.</p>
        </div>
        <FullPageLink className="button button-secondary" href="/admin">
          Back to admin
        </FullPageLink>
      </header>

      <section className="admin-card admin-editor-card" aria-labelledby="sessions-title">
        <h2 id="sessions-title">Active devices</h2>
        <p>Review active sessions and immediately sign out every device except this one.</p>
        <SessionManager
          sessions={activeSessions.map((item) => ({
            id: item.id,
            current: item.id === session.session.id,
            createdAt: new Date(item.createdAt).toISOString(),
            expiresAt: new Date(item.expiresAt).toISOString(),
            ipAddress: item.ipAddress ?? null,
            userAgent: item.userAgent ?? null,
          }))}
        />
      </section>

      <section
        className="admin-card admin-editor-card admin-revisions"
        aria-labelledby="password-title"
      >
        <h2 id="password-title">Change password</h2>
        <p>
          This also revokes every other active session. Your password is never stored in this form.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}

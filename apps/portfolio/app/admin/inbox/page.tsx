import { FullPageLink } from "@/components/full-page-link";
import { requireAdmin } from "@/lib/auth/policy";
import { listContactMessages } from "@/lib/contact/inbox";
import { InboxActions } from "./inbox-actions";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  await requireAdmin();
  const messages = await listContactMessages();
  const active = messages.filter((message) => message.status !== "archived");
  const archived = messages.filter((message) => message.status === "archived");
  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            <span />
            Private messages
          </p>
          <h1>Contact inbox</h1>
          <p className="admin-owner">Message contents never appear in operational logs.</p>
        </div>
        <FullPageLink className="button button-secondary" href="/admin">
          Back to admin
        </FullPageLink>
      </header>
      <section className="admin-card admin-revisions" aria-labelledby="inbox-title">
        <h2 id="inbox-title">Messages</h2>
        {active.length === 0 ? (
          <p>No messages received.</p>
        ) : (
          <div className="revision-list">
            {active.map((message) => (
              <details key={message.id}>
                <summary>
                  <strong>{message.subject}</strong> · {message.name} ·{" "}
                  {message.createdAt.toLocaleString()}
                </summary>
                <p>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                </p>
                <p>{message.body}</p>
                <InboxActions id={message.id} status={message.status} />
              </details>
            ))}
          </div>
        )}
        {archived.length > 0 ? (
          <details>
            <summary>
              {archived.length} archived message{archived.length === 1 ? "" : "s"}
            </summary>
            <div className="revision-list">
              {archived.map((message) => (
                <details key={message.id}>
                  <summary>
                    <strong>{message.subject}</strong> · {message.name}
                  </summary>
                  <p>{message.body}</p>
                  <InboxActions id={message.id} status={message.status} />
                </details>
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </main>
  );
}

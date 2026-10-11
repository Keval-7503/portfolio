import { FullPageLink } from "@/components/full-page-link";

export default function ForbiddenPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Access denied</h1>
        <p>This account is not authorized to manage the portfolio.</p>
        <FullPageLink className="button button-secondary" href="/">
          Return to portfolio
        </FullPageLink>
      </section>
    </main>
  );
}

import { FullPageLink } from "@/components/full-page-link";

export default function NotFoundPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="not-found-title">
        <p className="eyebrow">
          <span />
          404
        </p>
        <h1 id="not-found-title">Page not found.</h1>
        <p>The requested public page does not exist or is not published.</p>
        <FullPageLink className="button button-primary" href="/">
          Return home
        </FullPageLink>
      </section>
    </main>
  );
}

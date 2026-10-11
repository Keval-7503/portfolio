import { requireAdmin } from "@/lib/auth/policy";
import { ProjectCreateForm } from "./project-create-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdmin();
  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            <span />
            Owner-authored content
          </p>
          <h1>Create project</h1>
          <p className="admin-owner">
            New projects remain private drafts until explicitly published.
          </p>
        </div>
      </header>
      <section className="admin-card admin-editor-card">
        <ProjectCreateForm />
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";

import { getAdminProject, getProjectRevisions } from "@/lib/admin/projects";
import { requireAdmin } from "@/lib/auth/policy";
import { ProjectEditForm } from "./project-edit-form";
import { RevisionHistory } from "./revision-history";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();
  const revisions = await getProjectRevisions(id);

  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            <span />
            Secure editor
          </p>
          <h1>Edit project</h1>
        </div>
      </header>
      <section className="admin-card admin-editor-card">
        <p className="admin-kicker">GitHub source</p>
        <h2>{project.repositoryName ?? project.slug}</h2>
        <p>Source metadata remains synchronized. These fields control your public presentation.</p>
        <ProjectEditForm project={project} />
      </section>
      <section
        className="admin-card admin-editor-card admin-revisions"
        aria-labelledby="revision-title"
      >
        <p className="admin-kicker">Recovery</p>
        <h2 id="revision-title">Revision history</h2>
        <RevisionHistory
          projectId={id}
          revisions={revisions.map((revision) => ({
            ...revision,
            createdAt: revision.createdAt.toISOString(),
          }))}
        />
      </section>
    </main>
  );
}

import { notFound } from "next/navigation";

import { FullPageLink } from "@/components/full-page-link";
import { getAdminProject } from "@/lib/admin/projects";
import { requireAdmin } from "@/lib/auth/policy";
import { SafeMarkdown } from "@/lib/markdown/safe-markdown";

export const dynamic = "force-dynamic";

export default async function ProjectPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();
  const title = project.customTitle ?? project.repositoryName ?? project.slug;

  return (
    <main className="project-detail-shell">
      <header className="project-detail-header">
        <span className="admin-badge admin-badge-draft">Private owner preview</span>
        <FullPageLink className="project-back" href={`/admin/projects/${id}`}>
          Return to editor
        </FullPageLink>
      </header>
      <article className="project-detail">
        <div className="project-detail-intro">
          <p className="eyebrow">
            <span />
            {project.category ?? "Project"}
          </p>
          <h1>{title}</h1>
          <SafeMarkdown markdown={project.summaryMarkdown ?? "No summary added yet."} />
        </div>
        <section className="project-notes" aria-labelledby="preview-notes-title">
          <p className="section-index">OWNER PREVIEW · {project.publicationState.toUpperCase()}</p>
          <h2 id="preview-notes-title">Project details</h2>
          <SafeMarkdown markdown={project.bodyMarkdown ?? "No project notes added yet."} />
        </section>
      </article>
    </main>
  );
}

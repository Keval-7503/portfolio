import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { FullPageLink } from "@/components/full-page-link";
import { getPublicProjectBySlug, getPublicProjectRedirect } from "@/lib/projects/detail";
import { SafeMarkdown } from "@/lib/markdown/safe-markdown";
import { safeExternalUrl } from "@/lib/security/urls";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

const fullDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
  timeZone: "UTC",
});

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found | Keval Patel",
      robots: { index: false, follow: false },
    };
  }

  const title = project.title ?? project.repositoryName ?? project.slug;
  const description =
    project.summary ?? project.description ?? `Owner-published project details for ${title}.`;

  return {
    title: `${title} | Keval Patel`,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/projects/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    const destination = await getPublicProjectRedirect(slug);
    if (destination) permanentRedirect(`/projects/${destination}`);
    notFound();
  }

  const title = project.title ?? project.repositoryName ?? project.slug;
  const description =
    project.summary ??
    project.description ??
    "GitHub does not currently provide a description for this repository.";
  const projectSiteUrl = safeExternalUrl(project.homepageUrl);
  const projectJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: title,
    description,
    codeRepository: project.repositoryUrl ?? undefined,
    programmingLanguage: project.language ?? undefined,
    dateCreated: (project.githubCreatedAt ?? project.createdAt).toISOString(),
    dateModified: (project.githubUpdatedAt ?? project.updatedAt).toISOString(),
    author: { "@type": "Person", name: "Keval Patel" },
  }).replaceAll("<", "\\u003c");

  return (
    <main className="project-detail-shell">
      <script dangerouslySetInnerHTML={{ __html: projectJsonLd }} type="application/ld+json" />
      <a className="skip-link" href="#project-content">
        Skip to project details
      </a>
      <header className="project-detail-header">
        <FullPageLink className="brand" href="/" aria-label="Return to portfolio home">
          <span aria-hidden="true" className="brand-mark">
            W
          </span>
          <span>WORK / BENCH</span>
        </FullPageLink>
        <FullPageLink className="project-back" href="/#projects">
          All projects
        </FullPageLink>
      </header>

      <article id="project-content" className="project-detail">
        <div className="project-detail-intro">
          <p className="eyebrow">
            <span aria-hidden="true" />
            {project.repositoryUrl ? "Verified GitHub project" : "Owner-published project"}
          </p>
          <h1>{title}</h1>
          <p className="project-detail-summary">{description}</p>
          <div className="project-detail-actions">
            {project.repositoryUrl ? (
              <a
                className="button button-primary"
                href={project.repositoryUrl}
                rel="noreferrer"
                target="_blank"
              >
                View repository
              </a>
            ) : null}
            {projectSiteUrl ? (
              <a
                className="button button-secondary"
                href={projectSiteUrl}
                rel="noreferrer"
                target="_blank"
              >
                Visit project site
              </a>
            ) : null}
          </div>
        </div>

        <aside className="project-facts" aria-label="Project facts">
          <p className="section-index">PROJECT RECORD</p>
          <dl>
            <div>
              <dt>Language</dt>
              <dd>{project.language ?? "Not reported"}</dd>
            </div>
            <div>
              <dt>License</dt>
              <dd>{project.license ?? "Not reported"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{fullDate.format(project.githubCreatedAt ?? project.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{fullDate.format(project.githubUpdatedAt ?? project.updatedAt)}</dd>
            </div>
            <div>
              <dt>Stars</dt>
              <dd>{project.stars ?? "Not applicable"}</dd>
            </div>
            <div>
              <dt>Forks</dt>
              <dd>{project.forks ?? "Not applicable"}</dd>
            </div>
          </dl>
        </aside>

        <section className="project-source" aria-labelledby="source-title">
          <div>
            <p className="section-index">SOURCE STATUS</p>
            <h2 id="source-title">What this page can verify</h2>
          </div>
          <div>
            <p>
              {project.repositoryUrl
                ? "Repository identity and statistics come from the synchronized public GitHub record. Owner-written case-study content appears only after review and publication."
                : "This project was written and explicitly published by the authenticated portfolio owner."}
            </p>
            <ul className="project-status-list">
              {project.isFeatured ? <li>Featured project</li> : null}
              {project.repositoryUrl ? (
                <>
                  {project.isFork ? <li>Forked repository</li> : <li>Original repository</li>}
                  {project.isArchived ? <li>Archived on GitHub</li> : <li>Active on GitHub</li>}
                  <li>
                    {project.openIssues} open {project.openIssues === 1 ? "issue" : "issues"}
                  </li>
                </>
              ) : (
                <li>Owner-authored source</li>
              )}
            </ul>
          </div>
        </section>

        {project.body || project.readme ? (
          <section className="project-notes" aria-labelledby="project-notes-title">
            <p className="section-index">
              {project.body ? "OWNER-PUBLISHED NOTES" : "GITHUB README"}
            </p>
            <h2 id="project-notes-title">
              {project.body ? "Project details" : "Repository documentation"}
            </h2>
            <SafeMarkdown markdown={project.body ?? project.readme ?? ""} />
          </section>
        ) : null}

        {project.topics.length > 0 ? (
          <section className="project-topics" aria-labelledby="topics-title">
            <h2 id="topics-title">Topics</h2>
            <ul className="topic-list">
              {project.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </main>
  );
}

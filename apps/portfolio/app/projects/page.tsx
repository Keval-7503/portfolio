import type { Metadata } from "next";

import { FullPageLink } from "@/components/full-page-link";
import { PublicSectionShell } from "@/components/public-section-shell";
import { formatSiteCopy, getPublicSiteCopy } from "@/lib/homepage/site-copy";
import { getPublicRepositoryCards } from "@/lib/projects/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects | Keval Patel",
  description: "Published projects backed by synchronized public GitHub records.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const [result, copy] = await Promise.all([getPublicRepositoryCards(), getPublicSiteCopy()]);
  return (
    <PublicSectionShell
      eyebrow="Verified work"
      title="Projects"
      description={formatSiteCopy(copy["projects.description"], {
        count: result.repositories.length,
        source:
          result.source === "database"
            ? "the owner-controlled portfolio database"
            : "the last verified GitHub snapshot",
      })}
    >
      {result.repositories.length === 0 ? (
        <p className="empty-pill">{copy["projects.empty"]}</p>
      ) : (
        <div className="repository-grid public-project-grid">
          {result.repositories.map((project) => (
            <article className="repository-card" key={project.id}>
              <div className="repository-topline">
                <span>{project.language ?? "Language not reported"}</span>
                <span>{project.archived ? "Archived" : "Public"}</span>
              </div>
              <div>
                <h2>
                  <FullPageLink href={`/projects/${project.slug}`}>{project.name}</FullPageLink>
                </h2>
                <p>{project.description ?? copy["projects.repoFallback"]}</p>
              </div>
              {project.topics.length > 0 ? (
                <ul className="topic-list">
                  {project.topics.slice(0, 4).map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              ) : null}
              <div className="repository-footer">
                <span>Verified GitHub source</span>
                <FullPageLink href={`/projects/${project.slug}`}>Project details</FullPageLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </PublicSectionShell>
  );
}

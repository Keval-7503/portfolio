import { FullPageLink } from "@/components/full-page-link";
import { requireAdmin } from "@/lib/auth/policy";
import { getAdminDashboardData } from "@/lib/admin/dashboard";
import { getHomepageSections } from "@/lib/homepage/sections";
import { SITE_COPY_FIELDS } from "@/lib/homepage/site-copy";
import { LogoutButton } from "./logout-button";
import { HomepageSectionForm } from "./homepage-section-form";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: Date | null) {
  return value ? dateFormatter.format(value) : "Not available";
}

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AdminPage() {
  const { session } = await requireAdmin();
  const [dashboard, homepageSections] = await Promise.all([
    getAdminDashboardData(),
    getHomepageSections(),
  ]);
  const latestSync = dashboard.latestSync;
  return (
    <main className="admin-shell">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            <span />
            Owner verified
          </p>
          <h1>Portfolio admin</h1>
          <p className="admin-owner">Signed in as {session.user.email}</p>
        </div>
        <div className="admin-edit-actions">
          <FullPageLink className="button button-secondary" href="/admin/documents">
            Documents
          </FullPageLink>
          <FullPageLink className="button button-secondary" href="/admin/inbox">
            Inbox
          </FullPageLink>
          <FullPageLink className="button button-secondary" href="/admin/security">
            Security
          </FullPageLink>
          <LogoutButton />
        </div>
      </header>

      <section className="admin-stats" aria-label="Portfolio summary">
        <article className="admin-stat admin-stat-yellow">
          <span>Projects</span>
          <strong>{dashboard.projectCount}</strong>
          <p>Editorial records in Neon</p>
        </article>
        <article className="admin-stat admin-stat-blue">
          <span>Public repositories</span>
          <strong>{dashboard.publicRepositoryCount}</strong>
          <p>Available from GitHub</p>
        </article>
        <article className="admin-stat admin-stat-mint">
          <span>Latest sync</span>
          <strong className="admin-stat-status">
            {latestSync ? titleCase(latestSync.status) : "No runs"}
          </strong>
          <p>
            {latestSync
              ? formatDate(latestSync.completedAt ?? latestSync.startedAt)
              : "Run history is empty"}
          </p>
        </article>
      </section>

      <section className="admin-card admin-health" aria-labelledby="sync-health-title">
        <div>
          <p className="admin-kicker">GitHub source</p>
          <h2 id="sync-health-title">
            {dashboard.account ? `@${dashboard.account.username}` : "Not configured"}
          </h2>
        </div>
        <dl className="admin-health-list">
          <div>
            <dt>Automatic sync</dt>
            <dd>{dashboard.account?.syncEnabled ? "Enabled" : "Disabled"}</dd>
          </div>
          <div>
            <dt>Last successful sync</dt>
            <dd>{formatDate(dashboard.account?.lastSuccessfulSyncAt ?? null)}</dd>
          </div>
          <div>
            <dt>Latest trigger</dt>
            <dd>{latestSync ? titleCase(latestSync.trigger) : "Not available"}</dd>
          </div>
          <div>
            <dt>Repositories observed</dt>
            <dd>{latestSync?.itemsObserved ?? 0}</dd>
          </div>
        </dl>
        {latestSync?.status === "failed" ? (
          <p className="admin-alert" role="status">
            The latest sync failed{latestSync.errorCode ? ` (${latestSync.errorCode})` : ""}. Public
            project data remains available from the last successful sync.
          </p>
        ) : null}
      </section>

      <section className="admin-card admin-projects" aria-labelledby="homepage-sections-title">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">Public composition</p>
            <h2 id="homepage-sections-title">Homepage sections</h2>
          </div>
          <p>Reorder or hide sections. Saving updates the public homepage without a deployment.</p>
        </div>
        <HomepageSectionForm
          copyFields={SITE_COPY_FIELDS.map((field) => ({ ...field }))}
          initialSections={homepageSections}
        />
      </section>

      <section className="admin-card admin-projects" aria-labelledby="projects-title">
        <div className="admin-section-heading">
          <div>
            <p className="admin-kicker">Content inventory</p>
            <h2 id="projects-title">Projects</h2>
          </div>
          <div className="admin-edit-actions">
            <p>Edit owner-controlled content without changing synchronized GitHub facts.</p>
            <FullPageLink className="button button-primary" href="/admin/projects/new">
              Create project
            </FullPageLink>
          </div>
        </div>

        {dashboard.projects.length === 0 ? (
          <p className="admin-empty">No project records have been synchronized yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Publication</th>
                  <th scope="col">Visibility</th>
                  <th scope="col">Source</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.projects.map((project) => (
                  <tr key={project.id}>
                    <th scope="row">
                      <span>{project.customTitle ?? project.repositoryName ?? project.slug}</span>
                      <small>/{project.slug}</small>
                    </th>
                    <td>
                      <span className={`admin-badge admin-badge-${project.publicationState}`}>
                        {titleCase(project.publicationState)}
                      </span>
                      {project.isFeatured ? <small>Featured</small> : null}
                    </td>
                    <td>
                      <FullPageLink
                        className="admin-edit-link"
                        href={`/admin/projects/${project.id}`}
                      >
                        Edit
                      </FullPageLink>
                    </td>
                    <td>{titleCase(project.visibilityOverride)}</td>
                    <td>
                      {project.repositoryUrl ? (
                        <a href={project.repositoryUrl} rel="noreferrer" target="_blank">
                          GitHub
                        </a>
                      ) : (
                        "Manual"
                      )}
                      {project.availability === "missing" ? <small>Source missing</small> : null}
                      {project.isArchived ? <small>Archived on GitHub</small> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

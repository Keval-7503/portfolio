import { FullPageLink } from "@/components/full-page-link";
import { getPublicSiteCopy } from "@/lib/homepage/site-copy";
import { getPublicSiteSettings } from "@/lib/homepage/site-settings";

const publicLinks = [
  ["About", "/about"],
  ["Experience", "/experience"],
  ["Education", "/education"],
  ["Research", "/research"],
  ["Publications", "/publications"],
  ["Projects", "/projects"],
  ["Skills", "/skills"],
  ["Certifications", "/certifications"],
  ["Achievements", "/achievements"],
  ["Blog", "/blog"],
  ["Resume", "/resume"],
  ["Profiles", "/profiles"],
  ["Contact", "/contact"],
] as const;

export async function PublicSectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const [copy, settings] = await Promise.all([getPublicSiteCopy(), getPublicSiteSettings()]);
  return (
    <main className="project-detail-shell">
      <a className="skip-link" href="#public-section-content">
        Skip to content
      </a>
      <header className="project-detail-header">
        <FullPageLink className="brand" href="/" aria-label="Portfolio home">
          <span aria-hidden="true" className="brand-mark">
            {settings.displayName.charAt(0).toUpperCase()}
          </span>
          <span>{settings.displayName.toUpperCase().split(/\s+/).join(" / ")}</span>
        </FullPageLink>
        <FullPageLink className="project-back" href="/projects">
          Projects
        </FullPageLink>
      </header>

      <article className="project-detail" id="public-section-content">
        <div className="project-detail-intro">
          <p className="eyebrow">
            <span aria-hidden="true" />
            {eyebrow}
          </p>
          <h1>{title}</h1>
          <p className="project-detail-summary">{description}</p>
          {children}
        </div>

        <nav className="public-directory" aria-label="Portfolio sections">
          <h2>{copy["section.explore"]}</h2>
          <ul className="topic-list">
            {publicLinks.map(([label, href]) => (
              <li key={href}>
                <FullPageLink href={href}>{label}</FullPageLink>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </main>
  );
}

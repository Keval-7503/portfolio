import Image from "next/image";
import { FullPageLink } from "@/components/full-page-link";
import { ResearchList } from "@/components/research-list";
import { githubProfile } from "@/data/github-snapshot";
import { getCurrentPublicResume } from "@/lib/documents/access";
import {
  getPublicHomepageSections,
  type HomepageSectionConfiguration,
} from "@/lib/homepage/sections";
import { formatSiteCopy, resolveSiteCopy } from "@/lib/homepage/site-copy";
import { resolveSiteSettings } from "@/lib/homepage/site-settings";
import { getPublicRepositoryCards } from "@/lib/projects/public";

const navItems = [
  ["About", "#about"],
  ["Projects", "#projects"],
  ["Research", "#research"],
  ["Experience", "#experience"],
  ["Education", "#education"],
  ["Resume", "#resume"],
] as const;

function TimelineSection({
  configuration,
  id,
  index,
  order,
  title,
}: {
  configuration: HomepageSectionConfiguration;
  id: "experience" | "education";
  index: string;
  order: number;
  title: string;
}) {
  const entries = configuration.entries ?? [];
  return (
    <section
      className={`timeline-section timeline-section-${id}`}
      id={id}
      aria-labelledby={`${id}-title`}
      style={{ order }}
    >
      <div className="timeline-heading">
        <p className="section-index">{index}</p>
        <h2 id={`${id}-title`}>{configuration.heading ?? title}</h2>
        {configuration.intro ? <p>{configuration.intro}</p> : null}
      </div>
      <div className="timeline-list">
        {entries.map((entry, entryIndex) => (
          <article className="timeline-card" key={`${entry.organization}-${entry.period}`}>
            <span className="timeline-number">{String(entryIndex + 1).padStart(2, "0")}</span>
            <div>
              <p className="timeline-period">{entry.period}</p>
              <h3>{entry.title}</h3>
              <p className="timeline-organization">
                {entry.organization}
                {entry.location ? ` · ${entry.location}` : ""}
              </p>
              <p className="timeline-summary">{entry.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const [projectResult, homepageSections, currentResumeResult] = await Promise.all([
    getPublicRepositoryCards(),
    getPublicHomepageSections(),
    getCurrentPublicResume(),
  ]);
  const currentResume = currentResumeResult[0];
  const githubRepositories = projectResult.repositories;
  const siteSettings = resolveSiteSettings(homepageSections);
  const copy = resolveSiteCopy(homepageSections);
  const statusCards = [
    {
      number: "02",
      title: copy["home.deliveryTitle"],
      description: copy["home.deliveryDescription"],
      accent: "pink",
    },
    {
      number: "03",
      title: copy["home.dataTitle"],
      description: copy["home.dataDescription"],
      accent: "violet",
    },
  ] as const;
  const socialLinks = [
    { label: "GitHub", href: siteSettings.githubUrl },
    { label: "LinkedIn", href: siteSettings.linkedinUrl },
    { label: "Instagram", href: siteSettings.instagramUrl },
  ] as const;
  const sectionByKey = new Map(homepageSections.map((section) => [section.key, section]));
  const section = (key: (typeof homepageSections)[number]["key"]) =>
    sectionByKey.get(key) ?? { key, enabled: true, sortOrder: 0, configuration: {} };
  const publishedResearch = (section("research").configuration.researchEntries ?? []).filter(
    (entry) => entry.isPublished,
  );
  const enabledAnchors = new Set(
    homepageSections.filter((item) => item.enabled).map((item) => `#${item.key}`),
  );
  const personJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteSettings.displayName,
    url: "/",
    sameAs: socialLinks.map((link) => link.href),
    jobTitle: "IT Project Coordinator and PMO Professional",
  }).replaceAll("<", "\\u003c");

  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: personJsonLd }} type="application/ld+json" />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Portfolio home">
          <span aria-hidden="true" className="brand-mark">
            K
          </span>
          <span>{siteSettings.displayName.toUpperCase().split(/\s+/).join(" / ")}</span>
        </a>

        <nav aria-label="Primary navigation">
          <ul className="nav-list">
            {navItems
              .filter(([, href]) => enabledAnchors.has(href))
              .map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
          </ul>
        </nav>

        {section("contact").enabled ? (
          <a className="header-action" href="#contact">
            Say hello
          </a>
        ) : null}
      </header>

      <div className="homepage-composition" id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title" style={{ order: -1 }}>
          <div className="hero-copy">
            <p className="eyebrow">
              <span aria-hidden="true" /> GitHub identity verified
            </p>
            <h1 id="hero-title">
              {siteSettings.displayName}.
              <br />
              <span>{siteSettings.headline}</span>
            </h1>
            <p className="hero-intro">{copy["home.heroIntro"]}</p>
            <div className="hero-actions" aria-label="Portfolio actions">
              {section("projects").enabled ? (
                <a className="button button-primary" href="#projects">
                  Explore projects
                </a>
              ) : null}
              {section("resume").enabled ? (
                <a className="button button-secondary" href="#resume">
                  Resume status
                </a>
              ) : null}
            </div>
            <nav className="social-links" aria-label="Professional profiles">
              {socialLinks.map((link) => (
                <a href={link.href} key={link.label} rel="me noreferrer">
                  {link.label}
                </a>
              ))}
            </nav>
            <dl className="hero-facts" aria-label="Portfolio principles">
              <div>
                <dt>~4</dt>
                <dd>Years in delivery</dd>
              </div>
              <div>
                <dt>06</dt>
                <dd>PMO workstreams</dd>
              </div>
              <div>
                <dt>12</dt>
                <dd>Releases coordinated</dd>
              </div>
            </dl>
          </div>

          <div className="hero-art" aria-label="Original workbench robot mascot">
            <div className="art-note art-note-top" aria-hidden="true">
              <span>STATUS</span>
              <strong>FOUNDATION</strong>
            </div>
            <div className="robot-frame">
              <span className="spark spark-one" aria-hidden="true">
                ✦
              </span>
              <span className="spark spark-two" aria-hidden="true">
                ✦
              </span>
              <Image
                alt="A cheerful original workbench robot holding a tablet and pointing toward the portfolio introduction"
                className="robot-image"
                height={727}
                priority
                sizes="(max-width: 720px) 88vw, 44vw"
                src="/workbench-robot.webp"
                width={700}
              />
            </div>
            <div className="art-note art-note-bottom" aria-hidden="true">
              <span>MODE</span>
              <strong>BUILDING CAREFULLY</strong>
            </div>
          </div>
        </section>

        <section
          className="manifesto"
          hidden={!section("about").enabled}
          id="about"
          aria-labelledby="about-title"
          style={{ order: section("about").sortOrder }}
        >
          <p className="section-index">00 / APPROACH</p>
          <div>
            <h2 id="about-title">{copy["home.aboutHeading"]}</h2>
            <p>{copy["home.aboutBody"]}</p>
          </div>
          <div className="manifesto-stamp" aria-hidden="true">
            VERIFIED
            <br />
            OR OMITTED
          </div>
        </section>

        <section
          className="work-section"
          hidden={!section("projects").enabled}
          id="projects"
          aria-labelledby="work-title"
          style={{ order: section("projects").sortOrder }}
        >
          <div className="section-heading">
            <div>
              <p className="section-index">01 / THE WORK</p>
              <h2 id="work-title">{copy["home.projectsHeading"]}</h2>
            </div>
            <p>
              {formatSiteCopy(copy["home.projectsDescription"], {
                count: githubRepositories.length,
                login: githubProfile.login,
                source:
                  projectResult.source === "database"
                    ? "served from the synchronized portfolio database"
                    : "temporarily served from the last verified snapshot",
              })}
            </p>
          </div>

          <div className="repository-grid">
            {githubRepositories.map((repository, index) => (
              <article className="repository-card" key={repository.id}>
                <div className="repository-topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{repository.language ?? "Language not reported"}</span>
                </div>
                <div>
                  <h3>
                    <FullPageLink href={`/projects/${repository.slug}`}>
                      {repository.name}
                    </FullPageLink>
                  </h3>
                  <p>{repository.description ?? copy["home.projectFallback"]}</p>
                </div>
                {repository.topics.length > 0 ? (
                  <ul className="topic-list" aria-label={`${repository.name} topics`}>
                    {repository.topics.slice(0, 4).map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="repository-footer">
                  <span>
                    Updated{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(repository.updatedAt))}
                  </span>
                  <FullPageLink href={`/projects/${repository.slug}`}>Project details</FullPageLink>
                </div>
              </article>
            ))}
          </div>

          <div className="pending-heading">
            <p className="section-index">PROFESSIONAL FOCUS</p>
          </div>
          <div className="status-grid">
            {statusCards.map((card) => (
              <article className={`status-card ${card.accent}`} key={card.number}>
                <span className="card-number">{card.number}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <span className="card-status">Résumé-backed focus</span>
              </article>
            ))}
          </div>
        </section>

        <section
          className="split-section"
          hidden={!section("research").enabled}
          id="research"
          aria-labelledby="research-title"
          style={{ order: section("research").sortOrder }}
        >
          <div className="split-title">
            <p className="section-index">02 / RESEARCH</p>
            <h2 id="research-title">{copy["home.researchHeading"]}</h2>
          </div>
          <div className="split-copy">
            <p>{copy["home.researchBody"]}</p>
            {publishedResearch.length > 0 ? (
              <ResearchList entries={publishedResearch} />
            ) : (
              <span className="empty-pill">{copy["home.researchStatus"]}</span>
            )}
          </div>
        </section>

        <section
          className="resume-section"
          hidden={!section("resume").enabled}
          id="resume"
          aria-labelledby="resume-title"
          style={{ order: section("resume").sortOrder }}
        >
          <div>
            <p className="section-index">03 / RESUME</p>
            <h2 id="resume-title">
              {currentResume ? copy["home.resumeHeading"] : copy["home.resumeUnavailableHeading"]}
            </h2>
          </div>
          <p>
            {currentResume
              ? copy["home.resumeDescription"]
              : copy["home.resumeUnavailableDescription"]}
          </p>
          {currentResume ? (
            <FullPageLink className="button button-primary" href="/resume">
              Preview or download résumé
            </FullPageLink>
          ) : (
            <button className="button button-disabled" disabled type="button">
              No public résumé selected
            </button>
          )}
        </section>

        {section("experience").enabled ? (
          <TimelineSection
            configuration={section("experience").configuration}
            id="experience"
            index="04 / EXPERIENCE"
            order={section("experience").sortOrder}
            title="Professional experience"
          />
        ) : null}

        {section("education").enabled ? (
          <TimelineSection
            configuration={section("education").configuration}
            id="education"
            index="05 / EDUCATION"
            order={section("education").sortOrder}
            title="Education"
          />
        ) : null}

        <section
          className="contact-section"
          hidden={!section("contact").enabled}
          id="contact"
          aria-labelledby="contact-title"
          style={{ order: section("contact").sortOrder }}
        >
          <p className="section-index">06 / CONTACT</p>
          <h2 id="contact-title">{copy["home.contactHeading"]}</h2>
          <p>{copy["home.contactBody"]}</p>
          <FullPageLink className="button button-primary" href="/contact">
            Send a private message
          </FullPageLink>
        </section>
      </div>

      <footer>
        <span>
          {siteSettings.displayName} · {siteSettings.headline}
        </span>
        <nav className="footer-socials" aria-label="Social profiles">
          {socialLinks.map((link) => (
            <a href={link.href} key={link.label} rel="me noreferrer">
              {link.label}
            </a>
          ))}
        </nav>
      </footer>
    </main>
  );
}

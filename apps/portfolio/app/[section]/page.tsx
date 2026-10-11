import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PublicSectionShell } from "@/components/public-section-shell";
import { ResearchList } from "@/components/research-list";
import { getPublicHomepageSections } from "@/lib/homepage/sections";
import { getPublicSiteCopy, type SiteCopyKey } from "@/lib/homepage/site-copy";
import { getPublicSiteSettings } from "@/lib/homepage/site-settings";
import { ContactForm } from "../contact-form";
import { getContactIntegrationEnvironment } from "@/lib/env";

const sections = {
  about: {
    title: "About",
    eyebrow: "Delivery and technology",
    descriptionKey: "section.about",
  },
  experience: {
    title: "Experience",
    eyebrow: "Professional history",
    descriptionKey: "section.experience",
  },
  education: {
    title: "Education",
    eyebrow: "Academic record",
    descriptionKey: "section.education",
  },
  research: {
    title: "Research",
    eyebrow: "Research record",
    descriptionKey: "section.research",
  },
  publications: {
    title: "Publications",
    eyebrow: "Publication record",
    descriptionKey: "section.publications",
  },
  skills: {
    title: "Skills",
    eyebrow: "Capabilities",
    descriptionKey: "section.skills",
  },
  certifications: {
    title: "Certifications",
    eyebrow: "Credentials",
    descriptionKey: "section.certifications",
  },
  achievements: {
    title: "Achievements",
    eyebrow: "Recognition",
    descriptionKey: "section.achievements",
  },
  blog: {
    title: "Blog",
    eyebrow: "Writing",
    descriptionKey: "section.blog",
  },
  resume: {
    title: "Resume",
    eyebrow: "Public document",
    descriptionKey: "resume.unavailable",
  },
  profiles: {
    title: "Profiles",
    eyebrow: "Verified links",
    descriptionKey: "section.profiles",
  },
  contact: {
    title: "Contact",
    eyebrow: "Private inbox",
    descriptionKey: "section.contact",
  },
} as const;

type SectionPageProps = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const content = sections[section as keyof typeof sections];
  if (!content) return { title: "Page not found | Keval Patel", robots: { index: false } };
  const [copy, settings] = await Promise.all([getPublicSiteCopy(), getPublicSiteSettings()]);
  return {
    title: `${content.title} | ${settings.displayName}`,
    description: copy[content.descriptionKey as SiteCopyKey],
    alternates: { canonical: `/${section}` },
  };
}

export default async function PublicSectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const content = sections[section as keyof typeof sections];
  if (!content) notFound();
  const [copy, settings, homepageSections] = await Promise.all([
    getPublicSiteCopy(),
    getPublicSiteSettings(),
    getPublicHomepageSections(),
  ]);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const researchEntries =
    homepageSections
      .find((entry) => entry.key === "research")
      ?.configuration.researchEntries?.filter((entry) => entry.isPublished) ?? [];

  return (
    <PublicSectionShell
      description={copy[content.descriptionKey as SiteCopyKey]}
      eyebrow={content.eyebrow}
      title={content.title}
    >
      {section === "research" && researchEntries.length > 0 ? (
        <ResearchList entries={researchEntries} />
      ) : null}
      {section === "profiles" ? (
        <div className="project-detail-actions">
          <a
            className="button button-primary"
            href={settings.githubUrl}
            rel="noreferrer"
            target="_blank"
          >
            GitHub · {settings.displayName}
          </a>
        </div>
      ) : null}
      {section === "contact" ? (
        <ContactForm
          failureMessage={copy["contact.failure"]}
          successMessage={copy["contact.success"]}
          turnstileSiteKey={getContactIntegrationEnvironment().turnstileSiteKey}
          nonce={nonce}
        />
      ) : null}
    </PublicSectionShell>
  );
}

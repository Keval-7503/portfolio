import type { HomepageSection } from "./sections";
import { getPublicHomepageSections } from "./sections";

export const SITE_COPY_FIELDS = [
  {
    key: "home.heroIntro",
    group: "Homepage hero",
    label: "Hero introduction",
    multiline: true,
    defaultValue:
      "IT Project Coordinator and PMO professional supporting enterprise technology delivery, Agile execution, UAT, governance, and reporting—with a parallel portfolio in data science and AI/ML engineering.",
  },
  {
    key: "home.aboutHeading",
    group: "Homepage About",
    label: "About heading",
    defaultValue: "Project discipline meets technical depth.",
  },
  {
    key: "home.aboutBody",
    group: "Homepage About",
    label: "About description",
    multiline: true,
    defaultValue:
      "Keval brings together PMO governance, stakeholder coordination, requirements, delivery reporting, and UAT with practical work in Python, SQL, Power BI, machine learning, forecasting, and explainable AI.",
  },
  {
    key: "home.projectsHeading",
    group: "Homepage Projects",
    label: "Projects heading",
    defaultValue: "Published projects, with clear provenance.",
  },
  {
    key: "home.projectsDescription",
    group: "Homepage Projects",
    label: "Projects description template",
    multiline: true,
    defaultValue:
      "{count} published projects, including synchronized repositories owned by @{login}. Repository metadata is {source}.",
  },
  {
    key: "home.projectFallback",
    group: "Homepage Projects",
    label: "Missing repository description",
    defaultValue: "GitHub does not currently provide a repository description.",
  },
  {
    key: "home.deliveryTitle",
    group: "Homepage Focus",
    label: "Delivery focus title",
    defaultValue: "Delivery & PMO",
  },
  {
    key: "home.deliveryDescription",
    group: "Homepage Focus",
    label: "Delivery focus description",
    multiline: true,
    defaultValue:
      "Nearly four years coordinating enterprise technology delivery, Agile execution, UAT, governance, and cross-functional workflows.",
  },
  {
    key: "home.dataTitle",
    group: "Homepage Focus",
    label: "Data focus title",
    defaultValue: "Data & AI",
  },
  {
    key: "home.dataDescription",
    group: "Homepage Focus",
    label: "Data focus description",
    multiline: true,
    defaultValue:
      "Hands-on work across Power BI, SQL, forecasting, research-data automation, computer vision, and explainable AI.",
  },
  {
    key: "home.researchHeading",
    group: "Homepage Research",
    label: "Research heading",
    defaultValue: "From delivery metrics to research-grade data workflows.",
  },
  {
    key: "home.researchBody",
    group: "Homepage Research",
    label: "Research description",
    multiline: true,
    defaultValue:
      "Selected work includes research-data automation and Power BI reporting, financial time-series analytics, genomics data standardization, computer vision, and controlled machine-learning experiments.",
  },
  {
    key: "home.researchStatus",
    group: "Homepage Research",
    label: "Research status",
    defaultValue: "No research published yet",
  },
  {
    key: "home.resumeHeading",
    group: "Homepage Resume",
    label: "Published resume heading",
    defaultValue: "Review the current résumé.",
  },
  {
    key: "home.resumeDescription",
    group: "Homepage Resume",
    label: "Published resume description",
    multiline: true,
    defaultValue:
      "The selected résumé covers enterprise delivery, PMO coordination, analytics, education, and technical projects.",
  },
  {
    key: "home.resumeUnavailableHeading",
    group: "Homepage Resume",
    label: "Unavailable resume heading",
    defaultValue: "Résumé publication pending.",
  },
  {
    key: "home.resumeUnavailableDescription",
    group: "Homepage Resume",
    label: "Unavailable resume description",
    multiline: true,
    defaultValue: "No reviewed public résumé is selected. Private transcripts never appear here.",
  },
  {
    key: "home.contactHeading",
    group: "Homepage Contact",
    label: "Contact heading",
    defaultValue: "Have a relevant opportunity or collaboration?",
  },
  {
    key: "home.contactBody",
    group: "Homepage Contact",
    label: "Contact description",
    multiline: true,
    defaultValue:
      "Send a private message through the portfolio inbox for project delivery, PMO, data, or AI/ML opportunities. A personal email address is not exposed on this page.",
  },
  {
    key: "section.about",
    group: "Public section pages",
    label: "About page description",
    multiline: true,
    defaultValue:
      "Keval Patel combines enterprise project coordination and PMO governance with data science, analytics, and AI/ML engineering.",
  },
  {
    key: "section.experience",
    group: "Public section pages",
    label: "Experience page description",
    multiline: true,
    defaultValue:
      "Nearly four years supporting technology delivery, including IT Project Coordinator work at Atlassian and Project Coordinator / PMO Specialist work at S&P Global.",
  },
  {
    key: "section.education",
    group: "Public section pages",
    label: "Education page description",
    multiline: true,
    defaultValue:
      "M.S. in Computer Science from Florida Institute of Technology and B.Tech. in Information Technology from Charotar University of Science and Technology.",
  },
  {
    key: "section.research",
    group: "Public section pages",
    label: "Research page description",
    multiline: true,
    defaultValue:
      "Work includes research-data automation, financial time-series analytics, genomics data standardization, computer vision, and controlled machine-learning experiments.",
  },
  {
    key: "section.publications",
    group: "Public section pages",
    label: "Publications page description",
    defaultValue: "No publications have been reviewed and published yet.",
  },
  {
    key: "section.skills",
    group: "Public section pages",
    label: "Skills page description",
    multiline: true,
    defaultValue:
      "Project planning, Agile delivery, requirements, UAT, RAID and dependency tracking, Jira, Confluence, Microsoft Project, Power BI, SQL, Excel, Python, machine learning, and AI governance.",
  },
  {
    key: "section.certifications",
    group: "Public section pages",
    label: "Certifications page description",
    defaultValue: "No certifications have been verified and published yet.",
  },
  {
    key: "section.achievements",
    group: "Public section pages",
    label: "Achievements page description",
    defaultValue: "No achievements have been verified and published yet.",
  },
  {
    key: "section.blog",
    group: "Public section pages",
    label: "Blog page description",
    defaultValue: "No articles have been reviewed and published yet.",
  },
  {
    key: "section.profiles",
    group: "Public section pages",
    label: "Profiles page description",
    defaultValue: "Only profiles explicitly supplied or verified by the owner are shown.",
  },
  {
    key: "section.contact",
    group: "Public section pages",
    label: "Contact page description",
    defaultValue: "Send a private message without exposing a personal email address.",
  },
  {
    key: "section.explore",
    group: "Public section pages",
    label: "Directory heading",
    defaultValue: "Explore the portfolio",
  },
  {
    key: "projects.description",
    group: "Projects page",
    label: "Projects page description template",
    multiline: true,
    defaultValue: "{count} published projects are available from {source}.",
  },
  {
    key: "projects.empty",
    group: "Projects page",
    label: "Empty projects message",
    defaultValue: "No projects are currently published.",
  },
  {
    key: "projects.repoFallback",
    group: "Projects page",
    label: "Missing repository description",
    defaultValue: "GitHub does not currently provide a description.",
  },
  {
    key: "resume.available",
    group: "Resume page",
    label: "Available resume description",
    multiline: true,
    defaultValue:
      "Keval Patel's current résumé covers enterprise technology delivery, PMO coordination, Agile execution, analytics, education, and technical projects.",
  },
  {
    key: "resume.unavailable",
    group: "Resume page",
    label: "Unavailable resume description",
    multiline: true,
    defaultValue:
      "No reviewed public résumé is selected. Private transcripts and documents are never exposed here.",
  },
  {
    key: "contact.success",
    group: "Contact form",
    label: "Success message",
    defaultValue: "Message received. Thank you.",
  },
  {
    key: "contact.failure",
    group: "Contact form",
    label: "Failure message",
    defaultValue: "The message could not be sent. Please try again later.",
  },
] as const;

export type SiteCopyKey = (typeof SITE_COPY_FIELDS)[number]["key"];
export type SiteCopy = Record<SiteCopyKey, string>;

export const DEFAULT_SITE_COPY = Object.fromEntries(
  SITE_COPY_FIELDS.map((field) => [field.key, field.defaultValue]),
) as SiteCopy;

export function resolveSiteCopy(sections: HomepageSection[]): SiteCopy {
  const saved = sections.find((section) => section.key === "about")?.configuration.copy ?? {};
  return { ...DEFAULT_SITE_COPY, ...saved };
}

export async function getPublicSiteCopy() {
  return resolveSiteCopy(await getPublicHomepageSections());
}

export function formatSiteCopy(value: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

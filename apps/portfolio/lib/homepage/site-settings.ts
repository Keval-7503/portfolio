import type { HomepageSection } from "./sections";
import { getPublicHomepageSections } from "./sections";

export type PublicSiteSettings = {
  displayName: string;
  headline: string;
  metaTitle: string;
  metaDescription: string;
  githubUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
};

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  displayName: "Keval Patel",
  headline: "Coordinating delivery. Building with data.",
  metaTitle: "Keval Patel | Technology Delivery, PMO & Data",
  metaDescription:
    "Keval Patel coordinates enterprise technology delivery and builds practical data and AI projects.",
  githubUrl: "https://github.com/Keval-7503",
  linkedinUrl: "https://www.linkedin.com/in/kevalpatel-eng/",
  instagramUrl: "https://www.instagram.com/kevallpatel",
};

export function resolveSiteSettings(sections: HomepageSection[]): PublicSiteSettings {
  const configuration = sections.find((section) => section.key === "about")?.configuration ?? {};
  return {
    displayName: configuration.displayName || DEFAULT_SITE_SETTINGS.displayName,
    headline: configuration.headline || DEFAULT_SITE_SETTINGS.headline,
    metaTitle: configuration.metaTitle || DEFAULT_SITE_SETTINGS.metaTitle,
    metaDescription: configuration.metaDescription || DEFAULT_SITE_SETTINGS.metaDescription,
    githubUrl: configuration.githubUrl || DEFAULT_SITE_SETTINGS.githubUrl,
    linkedinUrl: configuration.linkedinUrl || DEFAULT_SITE_SETTINGS.linkedinUrl,
    instagramUrl: configuration.instagramUrl || DEFAULT_SITE_SETTINGS.instagramUrl,
  };
}

export async function getPublicSiteSettings() {
  return resolveSiteSettings(await getPublicHomepageSections());
}

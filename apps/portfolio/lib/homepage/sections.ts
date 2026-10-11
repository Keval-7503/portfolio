import { asc, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { homepageSections } from "@/db/schema";
import { logEvent } from "@/lib/observability/logger";

export const HOMEPAGE_SECTION_KEYS = [
  "about",
  "projects",
  "research",
  "resume",
  "experience",
  "education",
  "contact",
] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export type HomepageTimelineEntry = {
  title: string;
  organization: string;
  period: string;
  location: string;
  summary: string;
};

export type HomepageResearchEntry = {
  title: string;
  category: string;
  period: string;
  summary: string;
  url: string;
  isPublished: boolean;
};

export type HomepageSectionConfiguration = {
  heading?: string;
  intro?: string;
  entries?: HomepageTimelineEntry[];
  researchEntries?: HomepageResearchEntry[];
  displayName?: string;
  headline?: string;
  metaTitle?: string;
  metaDescription?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  copy?: Record<string, string>;
};

export type HomepageSection = {
  key: HomepageSectionKey;
  enabled: boolean;
  sortOrder: number;
  configuration: HomepageSectionConfiguration;
};

const defaultConfigurations: Partial<Record<HomepageSectionKey, HomepageSectionConfiguration>> = {
  about: {
    displayName: "Keval Patel",
    headline: "Coordinating delivery. Building with data.",
    metaTitle: "Keval Patel | Technology Delivery, PMO & Data",
    metaDescription:
      "Keval Patel coordinates enterprise technology delivery and builds practical data and AI projects.",
    githubUrl: "https://github.com/Keval-7503",
    linkedinUrl: "https://www.linkedin.com/in/kevalpatel-eng/",
    instagramUrl: "https://www.instagram.com/kevallpatel",
  },
  experience: {
    heading: "Enterprise delivery, coordinated with clarity.",
    intro:
      "Nearly four years supporting technology programs through planning, Agile execution, governance, UAT, reporting, and cross-functional coordination.",
    entries: [
      {
        title: "IT Project Coordinator",
        organization: "Atlassian",
        period: "Jun 2025 — Present",
        location: "United States",
        summary:
          "Coordinates enterprise technology delivery, workstream planning, stakeholder communication, governance, and release execution.",
      },
      {
        title: "Project Coordinator / PMO Specialist",
        organization: "S&P Global",
        period: "Jan 2022 — Jul 2024",
        location: "India",
        summary:
          "Supported PMO reporting, Agile delivery, requirements, RAID tracking, UAT, and coordinated releases across technical teams.",
      },
    ],
  },
  education: {
    heading: "Technical education grounded in applied work.",
    intro:
      "Graduate study in computer science complements an information technology foundation and hands-on work in analytics, machine learning, and software delivery.",
    entries: [
      {
        title: "Master of Science, Computer Science",
        organization: "Florida Institute of Technology",
        period: "Expected May 2026",
        location: "Melbourne, Florida",
        summary:
          "Graduate work spanning data science, machine learning, research workflows, and applied computing.",
      },
      {
        title: "Bachelor of Technology, Information Technology",
        organization: "Charotar University of Science and Technology",
        period: "May 2024",
        location: "Gujarat, India",
        summary:
          "Built a technical foundation across information systems, programming, databases, and software engineering.",
      },
    ],
  },
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = HOMEPAGE_SECTION_KEYS.map(
  (key, sortOrder) => ({
    key,
    enabled: true,
    sortOrder,
    configuration: defaultConfigurations[key] ?? {},
  }),
);

function normalizedSections(
  rows: Array<{
    key: string;
    enabled: boolean;
    sortOrder: number;
    configuration: Record<string, unknown>;
  }>,
) {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const knownKeys = new Set<string>(HOMEPAGE_SECTION_KEYS);
  const orderedKeys = rows
    .filter((row) => knownKeys.has(row.key))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((row) => row.key as HomepageSectionKey);
  const missingKeys = HOMEPAGE_SECTION_KEYS.filter((key) => !byKey.has(key));
  const timelineKeys = missingKeys.filter(
    (key): key is "experience" | "education" => key === "experience" || key === "education",
  );
  const contactIndex = orderedKeys.indexOf("contact");
  orderedKeys.splice(contactIndex >= 0 ? contactIndex : orderedKeys.length, 0, ...timelineKeys);
  for (const key of missingKeys) {
    if (!orderedKeys.includes(key)) orderedKeys.push(key);
  }

  return orderedKeys.map((key, sortOrder) => {
    const fallback = DEFAULT_HOMEPAGE_SECTIONS.find((entry) => entry.key === key)!;
    const row = byKey.get(fallback.key);
    return row
      ? {
          key: fallback.key,
          enabled: row.enabled,
          sortOrder,
          configuration: {
            ...fallback.configuration,
            ...(row.configuration as HomepageSectionConfiguration),
          },
        }
      : { ...fallback, sortOrder };
  });
}

async function resolveDb(db?: Database) {
  if (db) return db;
  return (await import("@/db")).getDb();
}

export async function getHomepageSections(db?: Database): Promise<HomepageSection[]> {
  const database = await resolveDb(db);
  const rows = await database
    .select({
      key: homepageSections.key,
      enabled: homepageSections.enabled,
      sortOrder: homepageSections.sortOrder,
      configuration: homepageSections.configuration,
    })
    .from(homepageSections)
    .orderBy(asc(homepageSections.sortOrder));
  return normalizedSections(rows);
}

export async function getPublicHomepageSections(): Promise<HomepageSection[]> {
  try {
    return await getHomepageSections();
  } catch {
    logEvent("error", "homepage.configuration_fallback", {
      outcome: "degraded",
      errorCode: "HOMEPAGE_CONFIGURATION_UNAVAILABLE",
    });
    return DEFAULT_HOMEPAGE_SECTIONS;
  }
}

export async function saveHomepageSections(entries: HomepageSection[], db?: Database) {
  const database = await resolveDb(db);
  const now = new Date();
  await database
    .insert(homepageSections)
    .values(
      entries.map((entry) => ({
        key: entry.key,
        enabled: entry.enabled,
        sortOrder: entry.sortOrder,
        configuration: entry.configuration,
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: homepageSections.key,
      set: {
        enabled: sql`excluded.enabled`,
        sortOrder: sql`excluded.sort_order`,
        configuration: sql`excluded.configuration`,
        updatedAt: now,
      },
    });
}

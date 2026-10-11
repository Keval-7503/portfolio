import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/env";
import { getPublicRepositoryCards } from "@/lib/projects/public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const result = await getPublicRepositoryCards();
  const publicSections = [
    "about",
    "experience",
    "education",
    "research",
    "publications",
    "projects",
    "skills",
    "certifications",
    "achievements",
    "blog",
    "resume",
    "profiles",
    "contact",
  ];

  return [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...publicSections.map((section) => ({
      url: `${origin}/${section}`,
      changeFrequency: "monthly" as const,
      priority: section === "projects" ? 0.9 : 0.6,
    })),
    ...result.repositories.map((project) => ({
      url: `${origin}/projects/${encodeURIComponent(project.slug)}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

import { z } from "zod";

import { HOMEPAGE_SECTION_KEYS } from "./sections";

const entrySchema = z.object({
  key: z.enum(HOMEPAGE_SECTION_KEYS),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
  configuration: z.object({
    heading: z.string().trim().max(160).optional(),
    intro: z.string().trim().max(600).optional(),
    displayName: z.string().trim().min(1).max(100).optional(),
    headline: z.string().trim().min(1).max(160).optional(),
    metaTitle: z.string().trim().min(1).max(120).optional(),
    metaDescription: z.string().trim().min(1).max(300).optional(),
    githubUrl: z.string().url().startsWith("https://").optional(),
    linkedinUrl: z.string().url().startsWith("https://").optional(),
    instagramUrl: z.string().url().startsWith("https://").optional(),
    copy: z.record(z.string().trim().min(1).max(1000)).optional(),
    entries: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(160),
          organization: z.string().trim().min(1).max(160),
          period: z.string().trim().min(1).max(80),
          location: z.string().trim().max(120),
          summary: z.string().trim().min(1).max(800),
        }),
      )
      .max(8)
      .optional(),
    researchEntries: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(180),
          category: z.string().trim().max(100),
          period: z.string().trim().max(80),
          summary: z.string().trim().min(1).max(1200),
          url: z.union([z.literal(""), z.string().url().startsWith("https://")]),
          isPublished: z.boolean(),
        }),
      )
      .max(12)
      .optional(),
  }),
});

export const homepageSectionsInputSchema = z
  .array(entrySchema)
  .length(HOMEPAGE_SECTION_KEYS.length)
  .superRefine((entries, context) => {
    if (new Set(entries.map((entry) => entry.key)).size !== HOMEPAGE_SECTION_KEYS.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Every section must appear once." });
    }
    if (new Set(entries.map((entry) => entry.sortOrder)).size !== entries.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Section order must be unique." });
    }
  });

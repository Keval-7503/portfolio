import { z } from "zod";

const optionalText = (maximum: number) =>
  z.union([z.string().trim().max(maximum), z.null()]).transform((value) => value || null);

export const projectUpdateSchema = z.object({
  customTitle: optionalText(120),
  summaryMarkdown: optionalText(2_000),
  bodyMarkdown: optionalText(100_000),
  category: optionalText(80),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
  publicationState: z.enum(["draft", "published", "archived"]),
  visibilityOverride: z.enum(["inherit", "force_hidden", "force_visible"]),
});

export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const projectCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summaryMarkdown: optionalText(2_000),
  bodyMarkdown: optionalText(100_000),
  category: optionalText(80),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

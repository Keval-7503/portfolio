import { z } from "zod";

export const contactInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0),
  "cf-turnstile-response": z.string().max(2048).optional(),
});

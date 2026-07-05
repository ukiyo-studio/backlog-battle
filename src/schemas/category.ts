import { z } from "zod";

/**
 * Category form validation. Limits mirror the DB check constraints:
 * name 1–100 chars (trimmed), description up to 500 chars.
 */
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give your category a name.")
    .max(100, "Keep the name to 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(500, "Keep the description to 500 characters or fewer."),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

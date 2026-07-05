import { z } from "zod";

import { ITEM_STATUSES } from "@/types/backlog";

/**
 * Form validation for backlog items. Create screens use the base schema
 * (new items are always 'active'); edit screens add the status selector.
 */
export const backlogItemFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the item a title.")
    .max(200, "Keep the title under 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Keep notes under 2000 characters."),
  itemType: z.string().trim().max(50, "Keep the type under 50 characters."),
});

export const backlogItemEditSchema = backlogItemFormSchema.extend({
  status: z.enum(ITEM_STATUSES),
});

export type BacklogItemFormValues = z.infer<typeof backlogItemFormSchema>;
export type BacklogItemEditValues = z.infer<typeof backlogItemEditSchema>;

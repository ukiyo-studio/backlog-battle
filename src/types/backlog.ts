import type { Tables } from "./database";

export type Category = Tables<"categories">;
export type BacklogItem = Tables<"backlog_items">;

export const ITEM_STATUSES = [
  "active",
  "completed",
  "archived",
  "removed",
] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** Category list row: category plus its non-deleted item count. */
export type CategoryWithItemCount = Category & {
  itemCount: number;
};

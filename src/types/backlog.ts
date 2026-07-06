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

export type Battle = Tables<"battles">;
export type BattleMatchup = Tables<"battle_matchups">;
export type BattleRanking = Tables<"battle_rankings">;

export const BATTLE_STATUSES = ["active", "completed", "abandoned"] as const;
export type BattleStatus = (typeof BATTLE_STATUSES)[number];

import {
  buildRanking,
  computeBattleState,
  shuffleItems,
  type BattleState,
  type DomainMatchup,
} from "@/domain";
import { supabase } from "@/lib/supabase";
import type { Battle, BattleMatchup, BattleRanking } from "@/types/backlog";

/** The slice of a backlog item that battle screens need to render. */
export interface BattleItem {
  id: string;
  title: string;
  item_type: string | null;
}

/** Everything a battle screen needs, loaded in one call. */
export interface BattleBundle {
  battle: Battle;
  matchups: DomainMatchup[];
  itemsById: Record<string, BattleItem>;
  state: BattleState;
}

/** Battle list row with the rank-1 item's title when the battle finished. */
export type CategoryBattle = Battle & { championTitle: string | null };

function toDomainMatchup(row: BattleMatchup): DomainMatchup {
  return {
    roundNumber: row.round_number,
    matchNumber: row.match_number,
    itemAId: row.item_a_id,
    itemBId: row.item_b_id,
    winnerItemId: row.winner_item_id,
  };
}

function toMatchupInsert(battleId: string, matchup: DomainMatchup) {
  return {
    battle_id: battleId,
    round_number: matchup.roundNumber,
    match_number: matchup.matchNumber,
    item_a_id: matchup.itemAId,
    item_b_id: matchup.itemBId,
  };
}

/**
 * Snapshot the category's active items into a new battle: shuffle with a
 * stored seed, insert the battles row, and persist the round-1 matchups.
 * Returns the new battle's id.
 */
export async function startBattle(input: {
  userId: string;
  categoryId: string;
}): Promise<string> {
  const { data: items, error: itemsError } = await supabase
    .from("backlog_items")
    .select("id")
    .eq("category_id", input.categoryId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (itemsError) throw new Error(itemsError.message);
  if (!items || items.length < 2) {
    throw new Error("Need at least 2 active items to start a battle");
  }

  const seed = Date.now() % 2 ** 31;
  const shuffled = shuffleItems(
    items.map((item) => item.id),
    seed,
  );

  const { data: battle, error: battleError } = await supabase
    .from("battles")
    .insert({
      user_id: input.userId,
      category_id: input.categoryId,
      participant_item_ids: shuffled,
      seed,
    })
    .select("id")
    .single();

  if (battleError) throw new Error(battleError.message);

  const state = computeBattleState(shuffled, []);
  if (state.nextRoundMatchups) {
    const { error: matchupsError } = await supabase
      .from("battle_matchups")
      .insert(state.nextRoundMatchups.map((m) => toMatchupInsert(battle.id, m)));
    if (matchupsError) throw new Error(matchupsError.message);
  }

  return battle.id;
}

/**
 * Battle row + persisted matchups + the participant items (soft-deleted ones
 * included so old battles still render) + the derived tournament state.
 * Resolves to null when the battle does not exist.
 */
export async function fetchBattleBundle(
  battleId: string,
): Promise<BattleBundle | null> {
  const { data: battle, error: battleError } = await supabase
    .from("battles")
    .select("*")
    .eq("id", battleId)
    .maybeSingle();

  if (battleError) throw new Error(battleError.message);
  if (!battle) return null;

  const { data: matchupRows, error: matchupsError } = await supabase
    .from("battle_matchups")
    .select("*")
    .eq("battle_id", battleId)
    .order("round_number", { ascending: true })
    .order("match_number", { ascending: true });

  if (matchupsError) throw new Error(matchupsError.message);

  const { data: items, error: itemsError } = await supabase
    .from("backlog_items")
    .select("id, title, item_type")
    .in("id", battle.participant_item_ids);

  if (itemsError) throw new Error(itemsError.message);

  const itemsById: Record<string, BattleItem> = {};
  for (const item of items ?? []) {
    itemsById[item.id] = item;
  }

  const matchups = (matchupRows ?? []).map(toDomainMatchup);
  let state = computeBattleState(battle.participant_item_ids, matchups);

  // Self-heal: a partial write failure (e.g. in recordWinner) can leave a
  // fully-decided round with its derived next round never persisted. Persist
  // it now so the battle can continue. ignoreDuplicates makes concurrent
  // loads safe (unique battle_id + round + match).
  if (battle.status === "active" && state.nextRoundMatchups) {
    const { error: healError } = await supabase
      .from("battle_matchups")
      .upsert(
        state.nextRoundMatchups.map((m) => toMatchupInsert(battle.id, m)),
        {
          onConflict: "battle_id,round_number,match_number",
          ignoreDuplicates: true,
        },
      );
    if (healError) throw new Error(healError.message);
    matchups.push(...state.nextRoundMatchups);
    state = computeBattleState(battle.participant_item_ids, matchups);
  }

  return { battle, matchups, itemsById, state };
}

/**
 * Persist a matchup decision and advance the tournament: guard against a
 * double-decide, derive + insert the next round when one becomes ready, and
 * on completion write the final ranking and close the battle. Returns the
 * updated state and matchup list for the screen to continue from.
 */
export async function recordWinner(input: {
  battleId: string;
  categoryId: string;
  matchup: DomainMatchup;
  winnerItemId: string;
  participantItemIds: readonly string[];
  allMatchups: readonly DomainMatchup[];
}): Promise<{ state: BattleState; matchups: DomainMatchup[] }> {
  const now = new Date().toISOString();

  const { data: updatedRows, error: updateError } = await supabase
    .from("battle_matchups")
    .update({ winner_item_id: input.winnerItemId, completed_at: now, updated_at: now })
    .eq("battle_id", input.battleId)
    .eq("round_number", input.matchup.roundNumber)
    .eq("match_number", input.matchup.matchNumber)
    .is("winner_item_id", null)
    .select("id");

  if (updateError) throw new Error(updateError.message);
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error(
      "This matchup was already decided elsewhere. Refresh to load the latest battle state.",
    );
  }

  const matchups = input.allMatchups.map((m) =>
    m.roundNumber === input.matchup.roundNumber &&
    m.matchNumber === input.matchup.matchNumber
      ? { ...m, winnerItemId: input.winnerItemId }
      : m,
  );

  const state = computeBattleState(input.participantItemIds, matchups);

  if (state.nextRoundMatchups) {
    const { error: insertError } = await supabase
      .from("battle_matchups")
      .insert(state.nextRoundMatchups.map((m) => toMatchupInsert(input.battleId, m)));
    if (insertError) throw new Error(insertError.message);
    matchups.push(...state.nextRoundMatchups);
  }

  if (state.isComplete) {
    const ranking = buildRanking(input.participantItemIds, matchups);
    const { error: rankingError } = await supabase.from("battle_rankings").insert(
      ranking.map((entry) => ({
        battle_id: input.battleId,
        category_id: input.categoryId,
        item_id: entry.itemId,
        rank: entry.rank,
      })),
    );
    if (rankingError) throw new Error(rankingError.message);

    const { error: completeError } = await supabase
      .from("battles")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", input.battleId);
    if (completeError) throw new Error(completeError.message);
  }

  return { state, matchups };
}

/** Mark an active battle as abandoned. No-op if it already ended. */
export async function abandonBattle(battleId: string): Promise<void> {
  const { error } = await supabase
    .from("battles")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("id", battleId)
    .eq("status", "active");

  if (error) throw new Error(error.message);
}

/**
 * All battles for a category, newest first, each annotated with the
 * champion's title (rank-1 ranking row) when completed.
 */
export async function fetchBattlesForCategory(
  categoryId: string,
): Promise<CategoryBattle[]> {
  const { data, error } = await supabase
    .from("battles")
    .select("*, battle_rankings(rank, backlog_items(title))")
    .eq("category_id", categoryId)
    .order("started_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const { battle_rankings: rankings, ...battle } = row;
    const champion = rankings.find((ranking) => ranking.rank === 1);
    return {
      ...battle,
      championTitle: champion?.backlog_items?.title ?? null,
    };
  });
}

/** The persisted final ranking rows for a battle, best rank first. */
export async function fetchRanking(battleId: string): Promise<BattleRanking[]> {
  const { data, error } = await supabase
    .from("battle_rankings")
    .select("*")
    .eq("battle_id", battleId)
    .order("rank", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

import {
  START_CHECK_DELAY_MS,
  CONTEXT_EXCLUSION_MS,
  buildDuelShortlist,
  buildRanking,
  computeBattleState,
  computeStartDuelState,
  isDuelContextEnergy,
  isDuelContextTime,
  selectDuelCandidates,
  type BattleState,
  type ContextFailure,
  type DomainMatchup,
  type DuelContextEnergy,
  type DuelContextTime,
  type StartDuelState,
} from "@/domain";
import { supabase } from "@/lib/supabase";
import type {
  Battle,
  BattleMatchup,
  BattleRanking,
  StartCheck,
  StartCheckOutcome,
} from "@/types/backlog";

/** The slice of a backlog item that battle screens need to render. */
export interface BattleItem {
  id: string;
  title: string;
  item_type: string | null;
}

interface BattleBundleBase {
  battle: Battle;
  matchups: DomainMatchup[];
  itemsById: Record<string, BattleItem>;
}

export interface KnockoutBattleBundle extends BattleBundleBase {
  algorithm: "knockout";
  state: BattleState;
}

export interface StartDuelBattleBundle extends BattleBundleBase {
  algorithm: "start_duel";
  state: StartDuelState;
  startCheck: StartCheck | null;
}

/** Everything a battle screen needs, loaded in one call. */
export type BattleBundle = KnockoutBattleBundle | StartDuelBattleBundle;

/** Battle list row with the finished pick or knockout champion title. */
export type CategoryBattle = Battle & {
  championTitle: string | null;
  pickTitle: string | null;
};

export interface DueStartCheck {
  id: string;
  battleId: string;
  itemId: string;
  title: string;
}

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

function titleFromEmbed(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object" || !("title" in row)) return null;
  return typeof row.title === "string" ? row.title : null;
}

async function loadBattleItems(
  itemIds: readonly string[],
): Promise<Record<string, BattleItem>> {
  if (itemIds.length === 0) return {};

  const { data: items, error } = await supabase
    .from("backlog_items")
    .select("id, title, item_type")
    .in("id", [...itemIds]);

  if (error) throw new Error(error.message);

  const itemsById: Record<string, BattleItem> = {};
  for (const item of items ?? []) {
    itemsById[item.id] = item;
  }
  return itemsById;
}

async function insertMatchups(
  battleId: string,
  matchups: readonly DomainMatchup[],
): Promise<void> {
  if (matchups.length === 0) return;
  const { error } = await supabase
    .from("battle_matchups")
    .insert(matchups.map((matchup) => toMatchupInsert(battleId, matchup)));
  if (error) throw new Error(error.message);
}

async function healMatchups(
  battleId: string,
  matchups: readonly DomainMatchup[],
): Promise<void> {
  if (matchups.length === 0) return;
  const { error } = await supabase.from("battle_matchups").upsert(
    matchups.map((matchup) => toMatchupInsert(battleId, matchup)),
    {
      onConflict: "battle_id,round_number,match_number",
      ignoreDuplicates: true,
    },
  );
  if (error) throw new Error(error.message);
}

async function finalizeStartDuel(
  battle: Battle,
  state: StartDuelState,
  now: string,
): Promise<void> {
  if (!state.isComplete || !state.pickItemId || !state.runnerUpItemId) {
    throw new Error("Cannot finish a duel that has no pick.");
  }
  if (
    !isDuelContextTime(battle.context_time) ||
    !isDuelContextEnergy(battle.context_energy)
  ) {
    throw new Error("This duel is missing its time and energy.");
  }

  const { error: completeError } = await supabase
    .from("battles")
    .update({
      status: "completed",
      completed_at: now,
      pick_item_id: state.pickItemId,
      runner_up_item_id: state.runnerUpItemId,
      updated_at: now,
    })
    .eq("id", battle.id)
    .eq("status", "active");

  if (completeError) throw new Error(completeError.message);

  const dueAt = new Date(Date.parse(now) + START_CHECK_DELAY_MS).toISOString();
  const { error: checkError } = await supabase.from("start_checks").upsert(
    {
      battle_id: battle.id,
      user_id: battle.user_id,
      category_id: battle.category_id,
      item_id: state.pickItemId,
      context_time: battle.context_time,
      context_energy: battle.context_energy,
      due_at: dueAt,
    },
    { onConflict: "battle_id", ignoreDuplicates: true },
  );
  if (checkError) throw new Error(checkError.message);
}

async function fetchStartCheck(battleId: string): Promise<StartCheck | null> {
  const { data, error } = await supabase
    .from("start_checks")
    .select("*")
    .eq("battle_id", battleId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Snapshot a shortlist of the category's active items into a Start Duel.
 * Items that recently bounced or were never opened in this same window are
 * left out unless that would leave fewer than two.
 */
export async function startBattle(input: {
  userId: string;
  categoryId: string;
  contextTime: DuelContextTime;
  contextEnergy: DuelContextEnergy;
}): Promise<string> {
  const { data: items, error: itemsError } = await supabase
    .from("backlog_items")
    .select("id")
    .eq("category_id", input.categoryId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (itemsError) throw new Error(itemsError.message);
  const activeIds = (items ?? []).map((item) => item.id);
  if (activeIds.length < 2) {
    throw new Error("Need at least 2 active items to start a duel");
  }

  const since = new Date(Date.now() - CONTEXT_EXCLUSION_MS).toISOString();
  const { data: failureRows, error: failuresError } = await supabase
    .from("start_checks")
    .select("item_id, context_time, context_energy, checked_at")
    .eq("user_id", input.userId)
    .eq("category_id", input.categoryId)
    .in("outcome", ["bounced", "never_opened"])
    .gte("checked_at", since);

  if (failuresError) throw new Error(failuresError.message);

  const failures: ContextFailure[] = [];
  for (const row of failureRows ?? []) {
    if (
      !row.checked_at ||
      !isDuelContextTime(row.context_time) ||
      !isDuelContextEnergy(row.context_energy)
    ) {
      continue;
    }
    failures.push({
      itemId: row.item_id,
      contextTime: row.context_time,
      contextEnergy: row.context_energy,
      checkedAt: row.checked_at,
    });
  }

  const pool = selectDuelCandidates({
    activeItemIds: activeIds,
    contextTime: input.contextTime,
    contextEnergy: input.contextEnergy,
    failures,
    now: new Date(),
  });
  if (pool.itemIds.length < 2) {
    throw new Error("Need at least 2 active items to start a duel");
  }

  const seed = Date.now() % 2 ** 31;
  const shortlist = buildDuelShortlist(pool.itemIds, seed);

  const { data: battle, error: battleError } = await supabase
    .from("battles")
    .insert({
      user_id: input.userId,
      category_id: input.categoryId,
      algorithm: "start_duel",
      participant_item_ids: shortlist,
      context_time: input.contextTime,
      context_energy: input.contextEnergy,
      pool_fallback: pool.usedFullList,
      seed,
    })
    .select("id")
    .single();

  if (battleError) throw new Error(battleError.message);

  const state = computeStartDuelState(shortlist, []);
  if (state.pendingMatchup) {
    await insertMatchups(battle.id, [state.pendingMatchup]);
  }

  return battle.id;
}

/**
 * Battle row + persisted matchups + the participant items (soft-deleted ones
 * included so old battles still render) + the derived state.
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

  const itemsById = await loadBattleItems(battle.participant_item_ids);
  const matchups = (matchupRows ?? []).map(toDomainMatchup);

  if (battle.algorithm === "start_duel") {
    return fetchStartDuelBundle(battle, matchups, itemsById);
  }

  let state = computeBattleState(battle.participant_item_ids, matchups);

  // Self-heal: a partial write failure (e.g. in recordWinner) can leave a
  // fully-decided round with its derived next round never persisted. Persist
  // it now so the battle can continue. ignoreDuplicates makes concurrent
  // loads safe (unique battle_id + round + match).
  if (battle.status === "active" && state.nextRoundMatchups) {
    await healMatchups(battle.id, state.nextRoundMatchups);
    matchups.push(...state.nextRoundMatchups);
    state = computeBattleState(battle.participant_item_ids, matchups);
  }

  return { algorithm: "knockout", battle, matchups, itemsById, state };
}

async function fetchStartDuelBundle(
  battle: Battle,
  matchups: DomainMatchup[],
  itemsById: Record<string, BattleItem>,
): Promise<StartDuelBattleBundle> {
  let state = computeStartDuelState(battle.participant_item_ids, matchups);
  let battleRow = battle;

  if (battle.status === "active" && state.pendingMatchup) {
    await healMatchups(battle.id, [state.pendingMatchup]);
    matchups.push(state.pendingMatchup);
    state = computeStartDuelState(battle.participant_item_ids, matchups);
  }

  if (state.isComplete && battle.status === "active") {
    const now = new Date().toISOString();
    await finalizeStartDuel(battle, state, now);
    battleRow = {
      ...battle,
      status: "completed",
      completed_at: now,
      pick_item_id: state.pickItemId,
      runner_up_item_id: state.runnerUpItemId,
    };
  }

  const startCheck = await fetchStartCheck(battle.id);
  return {
    algorithm: "start_duel",
    battle: battleRow,
    matchups,
    itemsById,
    state,
    startCheck,
  };
}

/**
 * Persist a knockout matchup decision and advance the tournament.
 * Start Duels use recordStartDuelChoice instead.
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
  const matchups = await decideMatchup(input, now);
  const state = computeBattleState(input.participantItemIds, matchups);

  if (state.nextRoundMatchups) {
    await insertMatchups(input.battleId, state.nextRoundMatchups);
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

/**
 * Persist one Start Duel choice. Inserts the next challenge, or closes the
 * duel with a pick, runner-up, and a follow-through check.
 */
export async function recordStartDuelChoice(input: {
  battleId: string;
  matchup: DomainMatchup;
  winnerItemId: string;
  participantItemIds: readonly string[];
  allMatchups: readonly DomainMatchup[];
}): Promise<{ state: StartDuelState; matchups: DomainMatchup[] }> {
  const now = new Date().toISOString();
  const matchups = await decideMatchup(input, now);
  let state = computeStartDuelState(input.participantItemIds, matchups);

  if (state.pendingMatchup) {
    await insertMatchups(input.battleId, [state.pendingMatchup]);
    matchups.push(state.pendingMatchup);
    state = computeStartDuelState(input.participantItemIds, matchups);
  }

  if (state.isComplete) {
    const { data: battle, error } = await supabase
      .from("battles")
      .select("*")
      .eq("id", input.battleId)
      .single();
    if (error) throw new Error(error.message);
    await finalizeStartDuel(battle, state, now);
  }

  return { state, matchups };
}

async function decideMatchup(
  input: {
    battleId: string;
    matchup: DomainMatchup;
    winnerItemId: string;
    allMatchups: readonly DomainMatchup[];
  },
  now: string,
): Promise<DomainMatchup[]> {
  const { data: updatedRows, error: updateError } = await supabase
    .from("battle_matchups")
    .update({
      winner_item_id: input.winnerItemId,
      completed_at: now,
      updated_at: now,
    })
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

  return input.allMatchups.map((matchup) =>
    matchup.roundNumber === input.matchup.roundNumber &&
    matchup.matchNumber === input.matchup.matchNumber
      ? { ...matchup, winnerItemId: input.winnerItemId }
      : matchup,
  );
}

/** Exchange the pick and runner-up once, before the follow-through is answered. */
export async function swapStartDuelRunnerUp(battleId: string): Promise<void> {
  const { data: battle, error } = await supabase
    .from("battles")
    .select("*")
    .eq("id", battleId)
    .single();

  if (error) throw new Error(error.message);
  if (!battle.pick_item_id || !battle.runner_up_item_id) {
    throw new Error("This duel has no runner-up to swap in.");
  }

  const now = new Date().toISOString();
  const nextPickId = battle.runner_up_item_id;
  const nextRunnerUpId = battle.pick_item_id;

  const { error: battleError } = await supabase
    .from("battles")
    .update({
      pick_item_id: nextPickId,
      runner_up_item_id: nextRunnerUpId,
      updated_at: now,
    })
    .eq("id", battleId);

  if (battleError) throw new Error(battleError.message);

  const { data: updated, error: checkError } = await supabase
    .from("start_checks")
    .update({
      item_id: nextPickId,
      runner_up_swapped: true,
      updated_at: now,
    })
    .eq("battle_id", battleId)
    .eq("runner_up_swapped", false)
    .is("outcome", null)
    .select("id");

  if (checkError || !updated || updated.length === 0) {
    await supabase
      .from("battles")
      .update({
        pick_item_id: battle.pick_item_id,
        runner_up_item_id: battle.runner_up_item_id,
        updated_at: now,
      })
      .eq("id", battleId);

    if (checkError) throw new Error(checkError.message);
    throw new Error(
      "The runner-up was already used, or this duel was already checked.",
    );
  }
}

/** The oldest unanswered follow-through whose due time has passed. */
export async function fetchDueStartCheck(
  userId: string,
): Promise<DueStartCheck | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("start_checks")
    .select("id, battle_id, item_id, backlog_items(title)")
    .eq("user_id", userId)
    .is("outcome", null)
    .lte("due_at", now)
    .order("due_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    battleId: data.battle_id,
    itemId: data.item_id,
    title: titleFromEmbed(data.backlog_items) ?? "that pick",
  };
}

/**
 * Record whether the committed pick was started. "I finished it" also marks
 * the backlog item completed so it leaves the next pool.
 */
export async function recordStartCheck(input: {
  checkId: string;
  itemId: string;
  outcome: StartCheckOutcome;
  markFinished?: boolean;
}): Promise<void> {
  const now = new Date().toISOString();

  if (input.markFinished) {
    const { error: itemError } = await supabase
      .from("backlog_items")
      .update({ status: "completed", updated_at: now })
      .eq("id", input.itemId)
      .is("deleted_at", null);

    if (itemError) throw new Error(itemError.message);
  }

  const { data, error } = await supabase
    .from("start_checks")
    .update({ outcome: input.outcome, checked_at: now, updated_at: now })
    .eq("id", input.checkId)
    .is("outcome", null)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("This check was already answered.");
  }
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
 * All battles for a category, newest first. Knockouts carry the rank-1 title.
 * Start Duels carry the committed pick title.
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

  const rows = data ?? [];
  const pickIds = rows
    .map((row) => row.pick_item_id)
    .filter((id): id is string => typeof id === "string");

  const pickTitles = new Map<string, string>();
  if (pickIds.length > 0) {
    const { data: picks, error: picksError } = await supabase
      .from("backlog_items")
      .select("id, title")
      .in("id", pickIds);

    if (picksError) throw new Error(picksError.message);
    for (const pick of picks ?? []) {
      pickTitles.set(pick.id, pick.title);
    }
  }

  return rows.map((row) => {
    const { battle_rankings: rankings, ...battle } = row;
    const champion = rankings.find((ranking) => ranking.rank === 1);
    return {
      ...battle,
      championTitle: champion?.backlog_items?.title ?? null,
      pickTitle: battle.pick_item_id
        ? (pickTitles.get(battle.pick_item_id) ?? null)
        : null,
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

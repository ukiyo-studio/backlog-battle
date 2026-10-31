-- Code-review hardening:
-- 1. Soft-deleted categories cannot be written through child tables
-- 2. Battle matchups/rankings must reference owned participant items
-- 3. Bound profiles.display_name length

-- ---------------------------------------------------------------------------
-- Soft-delete awareness on category ownership checks
-- ---------------------------------------------------------------------------

drop policy if exists "Users can insert own backlog items" on public.backlog_items;
create policy "Users can insert own backlog items"
  on public.backlog_items for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = (select auth.uid())
        and c.deleted_at is null
    )
  );

drop policy if exists "Users can update own backlog items" on public.backlog_items;
create policy "Users can update own backlog items"
  on public.backlog_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = (select auth.uid())
        and c.deleted_at is null
    )
  );

drop policy if exists "Users can insert own battles" on public.battles;
create policy "Users can insert own battles"
  on public.battles for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = (select auth.uid())
        and c.deleted_at is null
    )
  );

drop policy if exists "Users can update own battles" on public.battles;
create policy "Users can update own battles"
  on public.battles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id
        and c.user_id = (select auth.uid())
        and c.deleted_at is null
    )
  );

drop policy if exists "Users can insert own reminder settings" on public.reminder_settings;
create policy "Users can insert own reminder settings"
  on public.reminder_settings for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1
        from public.categories c
        where c.id = category_id
          and c.user_id = (select auth.uid())
          and c.deleted_at is null
      )
    )
  );

drop policy if exists "Users can update own reminder settings" on public.reminder_settings;
create policy "Users can update own reminder settings"
  on public.reminder_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1
        from public.categories c
        where c.id = category_id
          and c.user_id = (select auth.uid())
          and c.deleted_at is null
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Battle child rows: require owned participant items
-- ---------------------------------------------------------------------------

drop policy if exists "Users can insert own battle matchups" on public.battle_matchups;
create policy "Users can insert own battle matchups"
  on public.battle_matchups for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.battles b
      where b.id = battle_id
        and b.user_id = (select auth.uid())
        and item_a_id = any (b.participant_item_ids)
        and item_b_id = any (b.participant_item_ids)
    )
    and exists (
      select 1 from public.backlog_items a
      where a.id = item_a_id and a.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.backlog_items b
      where b.id = item_b_id and b.user_id = (select auth.uid())
    )
    and (
      winner_item_id is null
      or exists (
        select 1 from public.backlog_items w
        where w.id = winner_item_id and w.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can update own battle matchups" on public.battle_matchups;
create policy "Users can update own battle matchups"
  on public.battle_matchups for update
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.battles b
      where b.id = battle_id
        and b.user_id = (select auth.uid())
        and item_a_id = any (b.participant_item_ids)
        and item_b_id = any (b.participant_item_ids)
    )
    and exists (
      select 1 from public.backlog_items a
      where a.id = item_a_id and a.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.backlog_items b
      where b.id = item_b_id and b.user_id = (select auth.uid())
    )
    and (
      winner_item_id is null
      or exists (
        select 1 from public.backlog_items w
        where w.id = winner_item_id and w.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can insert own battle rankings" on public.battle_rankings;
create policy "Users can insert own battle rankings"
  on public.battle_rankings for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.battles b
      where b.id = battle_id
        and b.user_id = (select auth.uid())
        and b.category_id = category_id
        and item_id = any (b.participant_item_ids)
    )
    and exists (
      select 1 from public.backlog_items i
      where i.id = item_id and i.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own battle rankings" on public.battle_rankings;
create policy "Users can update own battle rankings"
  on public.battle_rankings for update
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.battles b
      where b.id = battle_id
        and b.user_id = (select auth.uid())
        and b.category_id = category_id
        and item_id = any (b.participant_item_ids)
    )
    and exists (
      select 1 from public.backlog_items i
      where i.id = item_id and i.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- profiles.display_name length bound
-- ---------------------------------------------------------------------------

alter table public.profiles
  drop constraint if exists profiles_display_name_length_check;

alter table public.profiles
  add constraint profiles_display_name_length_check
  check (display_name is null or char_length(display_name) <= 80);

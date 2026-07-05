-- Backlog Battle — Phase 2 hardening
-- Addresses two findings from the Phase 1 security audit:
--   1. backlog_items insert/update policies must verify the referenced
--      category belongs to the same user (prevents attaching items to
--      another user's category).
--   2. Length CHECK constraints on user-supplied text columns.
-- CHECK constraints on nullable columns pass automatically for NULL values,
-- so optional fields stay optional.

-- ---------------------------------------------------------------------------
-- backlog_items: category ownership check on insert/update
-- ---------------------------------------------------------------------------

-- USING clauses stay owner-scoped on user_id; only WITH CHECK gains the
-- category ownership verification.

drop policy if exists "Users can insert own backlog items" on public.backlog_items;
create policy "Users can insert own backlog items"
  on public.backlog_items for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
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
      where c.id = category_id and c.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- categories: length constraints
-- ---------------------------------------------------------------------------

alter table public.categories
  drop constraint if exists categories_name_length_check;
alter table public.categories
  add constraint categories_name_length_check
  check (char_length(name) between 1 and 100 and char_length(btrim(name)) > 0);

alter table public.categories
  drop constraint if exists categories_description_length_check;
alter table public.categories
  add constraint categories_description_length_check
  check (char_length(description) <= 500);

-- ---------------------------------------------------------------------------
-- backlog_items: length constraints
-- ---------------------------------------------------------------------------

alter table public.backlog_items
  drop constraint if exists backlog_items_title_length_check;
alter table public.backlog_items
  add constraint backlog_items_title_length_check
  check (char_length(title) between 1 and 200 and char_length(btrim(title)) > 0);

alter table public.backlog_items
  drop constraint if exists backlog_items_description_length_check;
alter table public.backlog_items
  add constraint backlog_items_description_length_check
  check (char_length(description) <= 2000);

alter table public.backlog_items
  drop constraint if exists backlog_items_item_type_length_check;
alter table public.backlog_items
  add constraint backlog_items_item_type_length_check
  check (char_length(item_type) <= 50);

alter table public.backlog_items
  drop constraint if exists backlog_items_image_url_length_check;
alter table public.backlog_items
  add constraint backlog_items_image_url_length_check
  check (char_length(image_url) <= 2048);

alter table public.backlog_items
  drop constraint if exists backlog_items_external_source_length_check;
alter table public.backlog_items
  add constraint backlog_items_external_source_length_check
  check (char_length(external_source) <= 100);

alter table public.backlog_items
  drop constraint if exists backlog_items_external_id_length_check;
alter table public.backlog_items
  add constraint backlog_items_external_id_length_check
  check (char_length(external_id) <= 255);

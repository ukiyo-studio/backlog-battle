-- Phase 4 hardening: category ownership on reminder_settings, token length cap

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
      )
    )
  );

alter table public.push_tokens
  drop constraint if exists push_tokens_token_length_check;

alter table public.push_tokens
  add constraint push_tokens_token_length_check
  check (char_length(token) <= 512);

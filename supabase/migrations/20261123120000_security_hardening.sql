-- ============================================
-- Security hardening + cleanup
-- Run once in Supabase → SQL Editor. Everything is in one transaction:
-- if any statement fails, nothing is changed.
-- ============================================

begin;

-- --------------------------------------------
-- 1. Admins: users without AI usage limits.
--    RLS on, no policies → only the service role (server) can read/write.
-- --------------------------------------------
create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

-- --------------------------------------------
-- 2. Functions: fixed search_path (Supabase advisor: function_search_path_mutable)
-- --------------------------------------------
alter function public.handle_new_user()   set search_path = public;
alter function public.update_updated_at() set search_path = public;

-- --------------------------------------------
-- 3. RLS policies: drop the old overlapping set, recreate one clean set.
--    Roles are `authenticated` (not `public`), and auth.uid() is wrapped in
--    (select ...) so it is evaluated once per query, not once per row.
-- --------------------------------------------
drop policy if exists "user_profiles: read own"   on public.user_profiles;
drop policy if exists "user_profiles: insert own" on public.user_profiles;
drop policy if exists "user_profiles: update own" on public.user_profiles;
drop policy if exists "Users read own profile"    on public.user_profiles;

drop policy if exists "lang_settings: read own" on public.user_language_settings;
drop policy if exists "lang_settings: all own"  on public.user_language_settings;

drop policy if exists "topics: public read"            on public.topics;
drop policy if exists "sentences: public read"         on public.sentences;
drop policy if exists "sentences: service role insert" on public.sentences;
drop policy if exists "sentence_parts: public read"    on public.sentence_parts;
drop policy if exists "dialog_scenarios: public read"  on public.dialog_scenarios;
drop policy if exists "level_tips: public read"        on public.level_tips;

drop policy if exists "user_sentences: all own"   on public.user_sentences;
drop policy if exists "weak_parts: all own"       on public.user_weak_parts;
drop policy if exists "dialog_sessions: all own"  on public.user_dialog_sessions;
drop policy if exists "dialog_messages: read own sessions"   on public.dialog_messages;
drop policy if exists "dialog_messages: insert own sessions" on public.dialog_messages;
drop policy if exists "essays: all own"          on public.user_essays;
drop policy if exists "Users view own essays"    on public.user_essays;
drop policy if exists "Users insert own essays"  on public.user_essays;
drop policy if exists "Users update own essays"  on public.user_essays;
drop policy if exists "video_sessions: all own"  on public.user_video_sessions;
drop policy if exists "books: all own"           on public.user_books;
drop policy if exists "book_items: all own"      on public.book_saved_items;
drop policy if exists "daily_activity: all own"  on public.user_daily_activity;
drop policy if exists "weekly_analytics: all own" on public.user_weekly_analytics;

-- Profile: the row is created by the handle_new_user trigger; the user can
-- read it and change only interface_language and app_color (column grant below).
create policy "profiles: read own" on public.user_profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: update own" on public.user_profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.user_profiles from anon, authenticated;
grant update (interface_language, app_color) on public.user_profiles to authenticated;

-- Data the user manages directly
create policy "lang_settings: own" on public.user_language_settings
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_sentences: own" on public.user_sentences
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "weak_parts: own" on public.user_weak_parts
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "books: own" on public.user_books
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "book_items: own" on public.book_saved_items
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Results computed by the server (AI scores, stats): the user may only read them.
-- The server writes them with the service role.
create policy "essays: read own" on public.user_essays
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dialog_sessions: read own" on public.user_dialog_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dialog_messages: read own" on public.dialog_messages
  for select to authenticated using (exists (
    select 1 from public.user_dialog_sessions s
    where s.id = dialog_messages.session_id and s.user_id = (select auth.uid())
  ));
create policy "video_sessions: read own" on public.user_video_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "daily_activity: read own" on public.user_daily_activity
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "weekly_analytics: read own" on public.user_weekly_analytics
  for select to authenticated using ((select auth.uid()) = user_id);

-- Shared content: signed-in users only (the anon key is public)
create policy "topics: read" on public.topics
  for select to authenticated using (true);
create policy "sentences: read" on public.sentences
  for select to authenticated using (true);
create policy "sentence_parts: read" on public.sentence_parts
  for select to authenticated using (true);
create policy "dialog_scenarios: read" on public.dialog_scenarios
  for select to authenticated using (true);
create policy "level_tips: read" on public.level_tips
  for select to authenticated using (true);

-- --------------------------------------------
-- 4. Learning language: at most one active per user, switched atomically
-- --------------------------------------------
-- Keep only the most recently updated active row per user
update public.user_language_settings u
   set is_active = false
 where u.is_active
   and exists (
     select 1 from public.user_language_settings o
      where o.user_id = u.user_id and o.is_active
        and (o.updated_at, o.id) > (u.updated_at, u.id)
   );

create unique index if not exists user_language_settings_one_active
  on public.user_language_settings (user_id) where is_active;

create or replace function public.set_active_language(p_language public.learning_lang)
returns public.user_language_settings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.user_language_settings;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.user_language_settings
     set is_active = false
   where user_id = auth.uid() and learning_language <> p_language and is_active;

  insert into public.user_language_settings (user_id, learning_language, is_active, level)
  values (auth.uid(), p_language, true, 'A1')
  on conflict (user_id, learning_language) do update set is_active = true
  returning * into result;

  return result;
end;
$$;
revoke execute on function public.set_active_language(public.learning_lang) from public, anon;
grant execute on function public.set_active_language(public.learning_lang) to authenticated;

-- --------------------------------------------
-- 5. Constraints and indexes
-- --------------------------------------------
-- user_sentences had the same unique (user_id, sentence_id) three times
alter table public.user_sentences drop constraint if exists user_sentences_user_sentence_unique;
drop index if exists public.user_sentences_user_sentence_uniq;

update public.user_sentences set is_active = true where is_active is null;
alter table public.user_sentences alter column is_active set default true;
alter table public.user_sentences alter column is_active set not null;

-- Weekly queries filter by (user_id, language, first_seen_at)
drop index if exists public.idx_user_sentences_user_lang;
create index if not exists idx_user_sentences_user_lang_seen
  on public.user_sentences (user_id, language, first_seen_at);

-- Duplicates the unique (user_id, language, date) index
drop index if exists public.idx_daily_activity_user_date;

-- Indexes for foreign keys (cascading deletes and joins)
create index if not exists idx_user_sentences_sentence    on public.user_sentences (sentence_id);
create index if not exists idx_book_items_book            on public.book_saved_items (book_id);
create index if not exists idx_user_books_user            on public.user_books (user_id);
create index if not exists idx_weak_parts_user            on public.user_weak_parts (user_id);
create index if not exists idx_weak_parts_part            on public.user_weak_parts (sentence_part_id);
create index if not exists idx_dialog_scenarios_topic     on public.dialog_scenarios (topic_id);
create index if not exists idx_dialog_sessions_scenario   on public.user_dialog_sessions (scenario_id);

-- Essay score is 1–10 (NOT VALID: checks new rows, leaves old ones alone)
alter table public.user_essays drop constraint if exists user_essays_ai_score_range;
alter table public.user_essays add constraint user_essays_ai_score_range
  check (ai_score is null or ai_score between 1 and 10) not valid;
alter table public.user_essays drop constraint if exists user_essays_word_count_positive;
alter table public.user_essays add constraint user_essays_word_count_positive
  check (word_count is null or word_count >= 0) not valid;

-- --------------------------------------------
-- 6. Unused: alphabet explanations are now static in core/alphabet-data.ts
-- --------------------------------------------
drop table if exists public.alphabet_explanations;

commit;

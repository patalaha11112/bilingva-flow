-- ============================================
-- Sentence sets instead of weeks.
--
-- A set is the 5 sentences (plus any the user adds) the user works through on
-- the daily path Sentences → Back-T → Essay. When every sentence of the set is
-- fully understood, the set is completed; the next set arrives on the
-- following day. The essay topic and words are generated once per set.
--
-- Daily activity: sentences_done now counts sentences whose breakdown was
-- opened today; the day's completeness is decided by the app (DAILY_GOALS),
-- so the generated fully_complete column is dropped.
-- ============================================

begin;

create table public.sentence_sets (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.user_profiles(id) on delete cascade,
  language           public.learning_lang not null,
  interface_language public.interface_lang not null,
  level              public.level_type not null,
  -- Calendar days in the user's time zone
  created_on         date not null,
  completed_on       date,
  skipped            boolean not null default false,
  essay_topic        text,
  essay_words        jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_sentence_sets_current
  on public.sentence_sets (user_id, language, interface_language, created_at desc);

create trigger update_sentence_sets_updated_at
  before update on public.sentence_sets
  for each row execute function public.update_updated_at();

-- Written only by the server (it decides when a set is completed and when the next one opens)
alter table public.sentence_sets enable row level security;
create policy "sentence_sets: read own" on public.sentence_sets
  for select to authenticated using ((select auth.uid()) = user_id);

alter table public.user_sentences
  add column set_id uuid references public.sentence_sets(id) on delete set null,
  add column last_viewed_on date;
create index idx_user_sentences_set on public.user_sentences (set_id);

-- The sentences users have now become their first set (progress is kept)
insert into public.sentence_sets (user_id, language, interface_language, level, created_on)
select distinct on (us.user_id, us.language, s.interface_language)
       us.user_id, us.language, s.interface_language, s.level, current_date
  from public.user_sentences us
  join public.sentences s on s.id = us.sentence_id
 where us.is_active
 order by us.user_id, us.language, s.interface_language, us.first_seen_at;

update public.user_sentences us
   set set_id = ss.id
  from public.sentences s, public.sentence_sets ss
 where us.is_active
   and s.id = us.sentence_id
   and ss.user_id = us.user_id
   and ss.language = us.language
   and ss.interface_language = s.interface_language;

alter table public.user_daily_activity drop column fully_complete;

commit;

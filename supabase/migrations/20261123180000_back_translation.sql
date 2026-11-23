-- ============================================
-- Back-T: translate a sentence of the week into your language, and on a later
-- day translate your own translation back, then compare with the original.
-- Also: daily activity rings become Sentences / Back-T / Essay.
-- ============================================

begin;

create table public.back_translations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.user_profiles(id) on delete cascade,
  sentence_id        uuid not null references public.sentences(id) on delete cascade,
  language           public.learning_lang not null,
  interface_language public.interface_lang not null,
  -- Step 1: the user's translation into the interface language
  forward_text       text not null check (char_length(forward_text) between 1 and 1000),
  forward_at         timestamptz not null default now(),
  -- Calendar day of step 1 in the user's time zone; step 2 opens on a later day
  forward_date       date not null,
  -- Step 2: the user's translation back into the learning language
  back_text          text check (char_length(back_text) between 1 and 1000),
  back_at            timestamptz,
  ai_score           int check (ai_score between 1 and 10),
  ai_feedback        jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, sentence_id)
);

create index idx_back_translations_user on public.back_translations (user_id, language, forward_date);

create trigger update_back_translations_updated_at
  before update on public.back_translations
  for each row execute function public.update_updated_at();

-- Written only by the server (it checks the next-day rule and stores the AI score)
alter table public.back_translations enable row level security;
create policy "back_translations: read own" on public.back_translations
  for select to authenticated using ((select auth.uid()) = user_id);

-- Daily activity: Back-T ring; "fully complete" is derived from the three rings
alter table public.user_daily_activity
  add column back_translation_done boolean not null default false;
alter table public.user_daily_activity drop column fully_complete;
alter table public.user_daily_activity
  add column fully_complete boolean generated always as
    (sentences_done > 0 and back_translation_done and essay_done) stored;

commit;

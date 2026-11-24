-- ============================================
-- Level test (placement): on the first visit or from Settings the user checks
-- their level in three steps — understanding (one sentence per level A1–C2),
-- translation into their own language (3 sentences) and an essay about
-- themselves. The AI estimates the level and keeps an "about me" text.
-- ============================================

begin;

-- Test sentences: shared content, generated once per language pair by the
-- server and reused. kind 'understand' has one per level and its parts;
-- kind 'translate' has three bands (stored as A2, B2, C1). Two variants each,
-- so a retake shows other sentences.
create table public.placement_items (
  id                 uuid primary key default gen_random_uuid(),
  language           public.learning_lang not null,
  interface_language public.interface_lang not null,
  kind               text not null check (kind in ('understand', 'translate')),
  level              public.level_type not null,
  variant            smallint not null check (variant between 0 and 9),
  sentence_text      text not null,
  translation        text not null,
  -- [{text, translation}] — the sentence split into meaningful chunks
  parts              jsonb not null default '[]',
  created_at         timestamptz not null default now(),
  unique (language, interface_language, kind, level, variant)
);

alter table public.placement_items enable row level security;
-- Reference translations stay on the server: the API sends only what the test shows
-- (no read policy for users; the server reads with the service role)

-- Results of each test the user took
create table public.placement_results (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.user_profiles(id) on delete cascade,
  language           public.learning_lang not null,
  interface_language public.interface_lang not null,
  level_estimate     public.level_type not null,
  result             jsonb not null,
  created_at         timestamptz not null default now()
);
create index placement_results_user_lang_idx on public.placement_results (user_id, language, created_at desc);

alter table public.placement_results enable row level security;
create policy "placement_results: read own" on public.placement_results
  for select to authenticated using ((select auth.uid()) = user_id);

-- "About me": a free text kept from the test essay; the user can edit or clear it.
-- Used to make essay topics personal.
alter table public.user_profiles
  add column about_me text check (char_length(about_me) <= 2000);
grant update (about_me) on public.user_profiles to authenticated;

commit;

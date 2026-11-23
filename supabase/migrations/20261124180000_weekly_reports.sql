-- ============================================
-- Weekly reports: every Monday the app sums up the previous week (Monday to
-- Sunday in the user's time zone) from Back-T checks and essays — estimated
-- level, strengths, what the user already knows and 2–3 focus areas, which
-- also steer the next sentence sets and essay topics.
-- Built on the first visit after the week ends (no cron), written by the server.
-- ============================================

begin;

create table public.weekly_reports (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.user_profiles(id) on delete cascade,
  language           public.learning_lang not null,
  interface_language public.interface_lang not null,
  week_start         date not null,
  -- Level chosen in settings when the report was made, and the AI's estimate
  level_set          public.level_type not null,
  level_estimate     public.level_type,
  report             jsonb not null,
  stats              jsonb not null,
  -- The user answered the "move to level X?" suggestion
  level_suggestion_answered boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, language, week_start)
);

create trigger update_weekly_reports_updated_at
  before update on public.weekly_reports
  for each row execute function public.update_updated_at();

alter table public.weekly_reports enable row level security;
create policy "weekly_reports: read own" on public.weekly_reports
  for select to authenticated using ((select auth.uid()) = user_id);

-- Essay corrections and alternatives, so weekly reports can see recurring mistakes
alter table public.user_essays add column ai_details jsonb;

commit;

-- ============================================
-- Remove tables and columns the app no longer uses (owner's decision,
-- 2026-11-24). Dialogs, videos, books, weak parts and weekly analytics can be
-- re-created with a new migration when those features come back.
-- ============================================

begin;

drop table if exists public.dialog_messages;
drop table if exists public.user_dialog_sessions;
drop table if exists public.dialog_scenarios;
drop table if exists public.user_video_sessions;
drop table if exists public.book_saved_items;
drop table if exists public.user_books;
drop table if exists public.user_weak_parts;
drop table if exists public.user_weekly_analytics;

-- Rings are Sentences / Back-T / Essay now
alter table public.user_daily_activity
  drop column if exists dialog_done,
  drop column if exists video_done,
  drop column if exists book_session;

-- No more weeks: essays are grouped by date
alter table public.user_essays
  drop column if exists week_number,
  drop column if exists year;

-- Enum types that only those tables used
drop type if exists public.dialog_role_type;
drop type if exists public.description_quality_type;
drop type if exists public.saved_item_type;
drop type if exists public.day_activity_type;

commit;

-- ============================================
-- Content per interface language (i18n step E)
--
-- A generated sentence belongs to one interface language: its translation,
-- pronunciation hints, explanations and tips are all written for speakers of
-- that language. So sentences get an interface_language column and a single
-- `translation` column instead of translation_ru / translation_en.
-- Topic names become one jsonb column {ru, en, es, ...}: a new interface
-- language is a new key, not a new column.
--
-- Legacy sentences stored translations of any language in translation_ru, so
-- they are deleted (owner's decision, 2026-11-23). This cascades to
-- sentence_parts and user_sentences (progress on those sentences).
-- ============================================

begin;

delete from public.sentences;

alter table public.sentences add column interface_language public.interface_lang not null;
alter table public.sentences rename column translation_ru to translation;
alter table public.sentences drop column translation_en;

alter table public.sentence_parts rename column translation_ru to translation;
alter table public.sentence_parts drop column translation_en;

-- The pool is looked up by (language, interface_language, level)
drop index if exists public.idx_sentences_lang_level;
create index if not exists idx_sentences_pool
  on public.sentences (language, interface_language, level);

-- Topic names
alter table public.topics add column name jsonb;
update public.topics
   set name = jsonb_strip_nulls(jsonb_build_object('ru', name_ru, 'en', name_en, 'es', name_es));
alter table public.topics alter column name set not null;
alter table public.topics drop column name_ru, drop column name_en, drop column name_es;

-- Translations in user data are in the user's interface language
alter table public.user_weak_parts  rename column translation_ru to translation;
alter table public.book_saved_items rename column translation_ru to translation;

commit;

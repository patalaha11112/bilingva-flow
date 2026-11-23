import type { InterfaceLang } from '@/lib/languages'

// ============================================
// The database still stores translations in one column per language
// (topics.name_ru/en/es, sentence_parts.translation_ru/en). All code that
// picks such a column goes through here, so replacing them with translation
// tables (i18n step E) touches only this file.
// ============================================

export const TOPIC_NAME_COLUMNS = 'name_ru, name_en, name_es'

type TopicNames = { name_ru: string; name_en: string; name_es: string }

export function pickTopicName(row: TopicNames, lang: InterfaceLang): string {
  const byLang: Record<InterfaceLang, string> = { ru: row.name_ru, en: row.name_en, es: row.name_es }
  return byLang[lang] || row.name_en
}

/** Sentence translations: generated text is stored in translation_ru whatever the language */
export function pickPartTranslation(row: { translation_ru: string; translation_en?: string | null }, lang: InterfaceLang): string {
  return lang === 'en' ? (row.translation_en ?? row.translation_ru) : row.translation_ru
}

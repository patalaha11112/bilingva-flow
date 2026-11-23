// ============================================
// LANGUAGE REGISTRY — the single source of truth for supported languages.
// Codes are ISO 639-1 and mean the same language in both lists
// ('es' is Spanish as an interface language and as a learning language).
//
// Adding an interface language: add an entry to INTERFACE_LANGUAGES, then fix
// every TypeScript error this produces (each one is a missing translation).
// Adding a learning language: add an entry to LEARNING_LANGUAGES.
// In both cases the matching Postgres enum must be extended with a migration:
//   alter type interface_lang add value '<code>';
//   alter type learning_lang  add value '<code>';
// ============================================

export interface InterfaceLanguageInfo {
  /** Name of the language in the language itself, shown in the picker */
  nativeName: string
  flag: string
  /** BCP 47 locale for <html lang>, Intl formatting, etc. */
  locale: string
  /** How the language is named in AI prompts */
  promptName: string
}

export const INTERFACE_LANGUAGES = {
  ru: { nativeName: 'Русский', flag: '🇷🇺', locale: 'ru-RU', promptName: 'Russian' },
  en: { nativeName: 'English', flag: '🇺🇸', locale: 'en-US', promptName: 'English' },
  es: { nativeName: 'Español', flag: '🇪🇸', locale: 'es-ES', promptName: 'Spanish' },
} as const satisfies Record<string, InterfaceLanguageInfo>

export type InterfaceLang = keyof typeof INTERFACE_LANGUAGES

/** Used when neither the profile nor the browser gives a supported language */
export const DEFAULT_INTERFACE_LANG: InterfaceLang = 'en'

export interface LearningLanguageInfo {
  flag: string
  /** Name of the language, shown to the user in their interface language */
  name: Record<InterfaceLang, string>
  /** Locale for speech synthesis; also defines the dialect taught */
  ttsLocale: string
  /** Whether core/alphabet-data.ts has an alphabet for this language */
  hasAlphabet: boolean
  prompt: {
    /** How the language (and dialect) is named in AI prompts */
    name: string
    /** Language-specific instructions for explaining sentence parts */
    explanationRules: readonly string[]
    /** Example of stress marking in pronunciation */
    pronunciationExample: string
  }
}

export const LEARNING_LANGUAGES = {
  es: {
    flag: '🇪🇸',
    name: { ru: 'Испанский', en: 'Spanish', es: 'Español' },
    ttsLocale: 'es-ES',
    hasAlphabet: true,
    prompt: {
      name: 'Spanish (Castilian, Spain)',
      explanationRules: [
        'Verbs: mention infinitive form + what conjugation this is',
        'Nouns: mention grammatical gender (el/la) + note if similar to a {ui} word',
        'Prepositions and connectors: explain the usage pattern, not just the meaning',
      ],
      pronunciationExample: '"nosotros hablamos" → "nosOtros abLAmos"',
    },
  },
  en: {
    flag: '🇺🇸',
    name: { ru: 'Английский', en: 'English', es: 'Inglés' },
    ttsLocale: 'en-US',
    hasAlphabet: true,
    prompt: {
      name: 'English (American)',
      explanationRules: [
        'Verbs: mention base form + tense; flag phrasal verbs and irregular past forms',
        'Nouns: note irregular plurals or countable/uncountable use when relevant',
        'Prepositions and connectors: explain the usage pattern, not just the meaning',
      ],
      pronunciationExample: '"I am reading" → "ai em REEding"',
    },
  },
} as const satisfies Record<string, LearningLanguageInfo>

export type LearningLang = keyof typeof LEARNING_LANGUAGES

export const DEFAULT_LEARNING_LANG: LearningLang = 'es'

export const INTERFACE_LANG_CODES = Object.keys(INTERFACE_LANGUAGES) as InterfaceLang[]
export const LEARNING_LANG_CODES = Object.keys(LEARNING_LANGUAGES) as LearningLang[]

/** Text stored per interface language, e.g. topics.name = { ru: '…', en: '…' } */
export type Localized = Partial<Record<InterfaceLang, string>>

/** Picks the text for `lang`, falling back to the default interface language, then to any value */
export function localized(value: Localized | null | undefined, lang: InterfaceLang): string {
  if (!value) return ''
  return value[lang] || value[DEFAULT_INTERFACE_LANG] || Object.values(value).find(Boolean) || ''
}

export function getInterfaceLanguage(code: InterfaceLang): InterfaceLanguageInfo {
  return INTERFACE_LANGUAGES[code]
}

export function getLearningLanguage(code: LearningLang): LearningLanguageInfo {
  return LEARNING_LANGUAGES[code]
}

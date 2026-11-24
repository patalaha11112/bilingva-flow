// ============================================
// DATABASE TYPES — Bilingva Flow AI
// Generated from Supabase schema v2
// ============================================

// ============================================
// ENUMS
// ============================================

// Language codes come from the registry; they must match the Postgres enums
// interface_lang and learning_lang (see lib/languages.ts)
import type { InterfaceLang, LearningLang, Localized } from '@/lib/languages'
export type { InterfaceLang, LearningLang }

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type AIModel = 'claude' | 'gpt' | 'gemini'

// ============================================
// DATABASE ROW TYPES
// ============================================

export interface UserProfile {
  id: string
  interface_language: InterfaceLang
  app_color: string
  /** Free "about me" text from the level test; the user can edit or clear it */
  about_me: string | null
  created_at: string
  updated_at: string
}

export interface UserLanguageSettings {
  id: string
  user_id: string
  learning_language: LearningLang
  level: Level
  level_confirmed_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  language: LearningLang
  level: Level
  /** Name per interface language */
  name: Localized
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Sentence {
  id: string
  language: LearningLang
  level: Level
  topic_id: string | null
  custom_topic: string | null
  /** Language the translation and explanations are written in */
  interface_language: InterfaceLang
  sentence_text: string
  translation: string
  visual_svg: string | null
  ai_model: AIModel
  times_shown: number
  created_at: string
}

export interface SentencePart {
  id: string
  sentence_id: string
  order_index: number
  text: string
  translation: string
  pronunciation: string
  explanation: string | null
  tip: string | null
  created_at: string
}

export interface UserSentence {
  id: string
  user_id: string
  sentence_id: string
  language: LearningLang
  understood_parts: string[]
  all_understood: boolean
  times_shown: number
  last_shown_at: string | null
  fully_mastered: boolean
  first_seen_at: string
  updated_at: string
  is_active: boolean
}

export interface UserEssay {
  id: string
  user_id: string
  language: LearningLang
  topic: string
  content: string
  word_count: number | null
  ai_feedback: string | null
  ai_score: number | null
  words_used: string[]
  is_bonus: boolean
  created_at: string
  updated_at: string
}

export interface UserDailyActivity {
  id: string
  user_id: string
  language: LearningLang
  date: string
  /** Sentences whose breakdown was opened that day */
  sentences_done: number
  essay_done: boolean
  back_translation_done: boolean
  created_at: string
  updated_at: string
}

export interface LevelTip {
  id: string
  language: LearningLang
  level: Level
  interface_language: InterfaceLang
  tip_text: string
  sort_order: number
  created_at: string
}

// ============================================
// JSONB NESTED TYPES
// ============================================

// ============================================
// EXTENDED TYPES (с JOIN данными)
// ============================================

export interface SentenceWithParts extends Sentence {
  sentence_parts: SentencePart[]
  topic?: Topic
}

export interface UserSentenceWithData extends UserSentence {
  sentence: SentenceWithParts
}

// ============================================
// API / UI TYPES
// ============================================

// Для генерации предложений через AI
export interface GenerateSentencesParams {
  language: LearningLang
  level: Level
  topic_id?: string
  custom_topic?: string
  count?: number // default 20
  interface_language: InterfaceLang
}

// Ответ AI при генерации предложений
export interface GeneratedSentence {
  sentence_text: string
  translation: string
  parts: GeneratedSentencePart[]
}

export interface GeneratedSentencePart {
  text: string
  translation: string
  pronunciation: string
  explanation?: string
  tip?: string
}

// Статистика для главной страницы
// Weekly counts for the home page
export interface UserStats {
  sentences_completed: number
  back_translations_completed: number
  essays_completed: number
}

// Активность за неделю для кружочков
// One day of the week rings: one ring per exercise
export interface WeekActivity {
  date: string
  sentences: boolean
  back_translation: boolean
  essay: boolean
  is_today: boolean
}

// Текущий язык и уровень пользователя
export interface ActiveLanguageInfo {
  settings: UserLanguageSettings
  topic: Topic | null
}

// ============================================
// SUPABASE DATABASE TYPE
// для createClient<Database>()
// ============================================

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      user_language_settings: {
        Row: UserLanguageSettings
        Insert: Omit<UserLanguageSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserLanguageSettings, 'id' | 'created_at'>>
      }
      topics: {
        Row: Topic
        Insert: Omit<Topic, 'id' | 'created_at'>
        Update: Partial<Omit<Topic, 'id' | 'created_at'>>
      }
      sentences: {
        Row: Sentence
        Insert: Omit<Sentence, 'id' | 'created_at' | 'times_shown'>
        Update: Partial<Omit<Sentence, 'id' | 'created_at'>>
      }
      sentence_parts: {
        Row: SentencePart
        Insert: Omit<SentencePart, 'id' | 'created_at'>
        Update: Partial<Omit<SentencePart, 'id' | 'created_at'>>
      }
      user_sentences: {
        Row: UserSentence
        Insert: Omit<UserSentence, 'id' | 'first_seen_at' | 'updated_at'>
        Update: Partial<Omit<UserSentence, 'id' | 'first_seen_at'>>
      }
      user_essays: {
        Row: UserEssay
        Insert: Omit<UserEssay, 'id' | 'created_at' | 'updated_at'> & { is_bonus?: boolean }
        Update: Partial<Omit<UserEssay, 'id' | 'created_at'>>
      }
      user_daily_activity: {
        Row: UserDailyActivity
        Insert: Omit<UserDailyActivity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserDailyActivity, 'id' | 'created_at'>>
      }
      level_tips: {
        Row: LevelTip
        Insert: Omit<LevelTip, 'id' | 'created_at'>
        Update: Partial<Omit<LevelTip, 'id' | 'created_at'>>
      }
    }
  }
}
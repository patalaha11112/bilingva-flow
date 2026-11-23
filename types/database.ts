// ============================================
// DATABASE TYPES — Bilingva Flow AI
// Generated from Supabase schema v2
// ============================================

// ============================================
// ENUMS
// ============================================

// Language codes come from the registry; they must match the Postgres enums
// interface_lang and learning_lang (see lib/languages.ts)
import type { InterfaceLang, LearningLang } from '@/lib/languages'
export type { InterfaceLang, LearningLang }

export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type AIModel = 'claude' | 'gpt' | 'gemini'
export type SavedItemType = 'word' | 'sentence'
export type DayActivityType = 'dialog' | 'essay'
export type DescriptionQuality = 'detailed' | 'topic' | 'watched'
export type DialogRole = 'bot' | 'user'

// ============================================
// DATABASE ROW TYPES
// ============================================

export interface UserProfile {
  id: string
  interface_language: InterfaceLang
  app_color: string
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
  name_ru: string
  name_en: string
  name_es: string
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
  sentence_text: string
  translation_ru: string
  translation_en: string | null
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
  translation_ru: string
  translation_en: string | null
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

export interface UserWeakPart {
  id: string
  user_id: string
  sentence_part_id: string | null
  language: LearningLang
  text: string
  translation_ru: string
  context_sentence: string | null
  times_practiced: number
  mastered: boolean
  created_at: string
  updated_at: string
}

export interface DialogScenario {
  id: string
  language: LearningLang
  level: Level
  topic_id: string | null
  opening_message: string
  target_words: TargetWord[]
  turns_count: number
  ai_model: AIModel
  times_used: number
  created_at: string
}

export interface DialogMessage {
  id: string
  session_id: string
  role: DialogRole
  content: string
  target_words_used: string[]
  created_at: string
}

export interface UserDialogSession {
  id: string
  user_id: string
  scenario_id: string | null
  language: LearningLang
  target_words_used: string[]
  ai_feedback: string | null
  ai_score: number | null
  completed: boolean
  completed_at: string | null
  week_number: number
  year: number
  created_at: string
  updated_at: string
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
  week_number: number
  year: number
  created_at: string
  updated_at: string
}

export interface UserVideoSession {
  id: string
  user_id: string
  language: LearningLang
  youtube_video_id: string
  video_title: string | null
  video_duration_sec: number | null
  level: Level
  user_description: string | null
  description_quality: DescriptionQuality | null
  ai_feedback: string | null
  ai_score: number | null
  week_number: number
  year: number
  created_at: string
  updated_at: string
}

export interface UserBook {
  id: string
  user_id: string
  title: string
  author: string | null
  language: LearningLang
  file_path: string
  file_size_bytes: number | null
  current_position: BookPosition | null
  total_words_saved: number
  created_at: string
  updated_at: string
}

export interface BookSavedItem {
  id: string
  user_id: string
  book_id: string
  type: SavedItemType
  text: string
  context_sentence: string | null
  translation_ru: string | null
  ai_explanation: string | null
  practiced: boolean
  added_to_module: boolean
  times_practiced: number
  created_at: string
  updated_at: string
}

export interface UserDailyActivity {
  id: string
  user_id: string
  language: LearningLang
  date: string
  sentences_done: number
  dialog_done: boolean
  essay_done: boolean
  video_done: boolean
  book_session: boolean
  fully_complete: boolean
  created_at: string
  updated_at: string
}

export interface UserWeeklyAnalytics {
  id: string
  user_id: string
  language: LearningLang
  week_number: number
  year: number
  sentences_completed: number
  dialogs_completed: number
  essays_completed: number
  videos_completed: number
  words_mastered: string[]
  weak_areas: WeakArea[]
  avg_score: number | null
  recommended_level: Level | null
  ai_summary: string | null
  level_change_suggested: boolean
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

export interface TargetWord {
  text: string
  translation: string
  times_used: number
}

export interface BookPosition {
  cfi?: string        // EPUB CFI позиция
  percentage?: number // процент прочитанного
  chapter?: number
}

export interface WeakArea {
  topic: string
  error_type: string  // grammar / vocabulary / pronunciation
  count: number
}

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

export interface DialogSessionWithMessages extends UserDialogSession {
  dialog_messages: DialogMessage[]
  dialog_scenarios: DialogScenario | null
}

export interface BookWithItems extends UserBook {
  book_saved_items: BookSavedItem[]
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
  translation_ru: string
  translation_en?: string
  parts: GeneratedSentencePart[]
}

export interface GeneratedSentencePart {
  text: string
  translation_ru: string
  translation_en?: string
  pronunciation: string
  explanation?: string
  tip?: string
}

// Статистика для главной страницы
export interface UserStats {
  sentences_completed: number
  dialogs_completed: number
  essays_completed: number
  videos_completed: number
}

// Активность за неделю для кружочков
export interface WeekActivity {
  date: string
  fully_complete: boolean
  partially_complete: boolean // хотя бы одно упражнение
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
      user_weak_parts: {
        Row: UserWeakPart
        Insert: Omit<UserWeakPart, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserWeakPart, 'id' | 'created_at'>>
      }
      dialog_scenarios: {
        Row: DialogScenario
        Insert: Omit<DialogScenario, 'id' | 'created_at' | 'times_used'>
        Update: Partial<Omit<DialogScenario, 'id' | 'created_at'>>
      }
      dialog_messages: {
        Row: DialogMessage
        Insert: Omit<DialogMessage, 'id' | 'created_at'>
        Update: Partial<Omit<DialogMessage, 'id' | 'created_at'>>
      }
      user_dialog_sessions: {
        Row: UserDialogSession
        Insert: Omit<UserDialogSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserDialogSession, 'id' | 'created_at'>>
      }
      user_essays: {
        Row: UserEssay
        Insert: Omit<UserEssay, 'id' | 'created_at' | 'updated_at'> & { is_bonus?: boolean }
        Update: Partial<Omit<UserEssay, 'id' | 'created_at'>>
      }
      user_video_sessions: {
        Row: UserVideoSession
        Insert: Omit<UserVideoSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserVideoSession, 'id' | 'created_at'>>
      }
      user_books: {
        Row: UserBook
        Insert: Omit<UserBook, 'id' | 'created_at' | 'updated_at' | 'total_words_saved'>
        Update: Partial<Omit<UserBook, 'id' | 'created_at'>>
      }
      book_saved_items: {
        Row: BookSavedItem
        Insert: Omit<BookSavedItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BookSavedItem, 'id' | 'created_at'>>
      }
      user_daily_activity: {
        Row: UserDailyActivity
        Insert: Omit<UserDailyActivity, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserDailyActivity, 'id' | 'created_at'>>
      }
      user_weekly_analytics: {
        Row: UserWeeklyAnalytics
        Insert: Omit<UserWeeklyAnalytics, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserWeeklyAnalytics, 'id' | 'created_at'>>
      }
      level_tips: {
        Row: LevelTip
        Insert: Omit<LevelTip, 'id' | 'created_at'>
        Update: Partial<Omit<LevelTip, 'id' | 'created_at'>>
      }
    }
  }
}
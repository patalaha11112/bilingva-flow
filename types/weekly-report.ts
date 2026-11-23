import type { Level } from '@/types/database'

// Weekly report shapes (shared by client and server)

export interface WeeklyStats {
  days_active: number
  days_complete: number
  sentences_viewed: number
  sets_completed: number
  back_translations: number
  back_translation_avg: number | null
  essays: number
  essay_avg: number | null
}

export interface ReportContent {
  headline: string
  level_estimate: Level
  confidence: 'low' | 'medium' | 'high'
  level_comment: string
  strengths: { title: string; example: string }[]
  known: string[]
  focus_areas: { title: string; why: string; example: string; prompt_hint: string }[]
  encouragement: string
}

export interface WeeklyReport {
  id: string
  /** Monday of the reported week */
  week_start: string
  level_set: Level
  level_estimate: Level | null
  /** null when the week had too little checked work for an analysis */
  report: ReportContent | null
  stats: WeeklyStats
  level_suggestion_answered: boolean
}

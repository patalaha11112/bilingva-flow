import { createAdminClient } from '@/lib/supabase/admin'
import { INTERFACE_LANG_CODES, LEARNING_LANG_CODES } from '@/lib/languages'
import { LEVELS } from '@/core/constants'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'

// ============================================
// Limits on AI usage for regular users. Admins (rows in public.app_admins)
// have no limits. The table is readable only with the service-role key, so a
// user can't grant themselves admin.
// ============================================

export const LIMITS = {
  /** Sentences linked per learning language per week (initial set + add + refresh) */
  sentencesPerWeek: 30,
  /** Active sentences shown at once */
  activeSentences: 10,
  /** Essays graded per day */
  essaysPerDay: 20,
  /** Max essay length sent to the AI */
  essayMaxChars: 4000,
  /** Max length of a custom topic (admins only) */
  customTopicMaxChars: 80,
} as const

export async function isAppAdmin(userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('app_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[access] admin check failed:', error.message)
    return false
  }
  return !!data
}

export const isLearningLang = (v: unknown): v is LearningLang =>
  typeof v === 'string' && (LEARNING_LANG_CODES as string[]).includes(v)

export const isInterfaceLang = (v: unknown): v is InterfaceLang =>
  typeof v === 'string' && (INTERFACE_LANG_CODES as string[]).includes(v)

export const isLevel = (v: unknown): v is Level =>
  typeof v === 'string' && (LEVELS as readonly string[]).includes(v)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)

/** Strips characters that could break out of a quoted prompt value */
export function sanitizePromptText(text: string, maxChars: number): string {
  return text.replace(/["`\\\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxChars)
}

/** Monday 00:00 UTC of the current week */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() || 7) - 1))
  return d.toISOString()
}

import { createAdminClient } from '@/lib/supabase/admin'
import type { LearningLang } from '@/types/database'

// ============================================
// Daily activity (the rings on the home page), counted in the user's own
// calendar day: the client sends its IANA time zone with each request.
// Written with the service role — users can only read their activity.
// ============================================

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** 'YYYY-MM-DD' of `date` in time zone `tz` */
export function localDate(tz: string, date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

type ActivityPatch = {
  /** Adds to sentences_done */
  sentencesDone?: number
  essayDone?: boolean
  backTranslationDone?: boolean
}

export async function markActivity(userId: string, language: LearningLang, tz: string, patch: ActivityPatch) {
  const admin = createAdminClient()
  const date = localDate(tz)
  try {
    const { data: row } = await admin
      .from('user_daily_activity')
      .select('id, sentences_done')
      .eq('user_id', userId)
      .eq('language', language)
      .eq('date', date)
      .maybeSingle()

    const fields: Record<string, unknown> = {}
    if (patch.sentencesDone) fields.sentences_done = Math.max(0, (row?.sentences_done ?? 0) + patch.sentencesDone)
    if (patch.essayDone) fields.essay_done = true
    if (patch.backTranslationDone) fields.back_translation_done = true
    if (Object.keys(fields).length === 0) return

    const { error } = row
      ? await admin.from('user_daily_activity').update(fields).eq('id', row.id)
      : await admin.from('user_daily_activity').insert({ user_id: userId, language, date, ...fields })
    if (error) console.error('[activity] save error:', error.message)
  } catch (err) {
    console.error('[activity] failed (non-fatal):', err)
  }
}

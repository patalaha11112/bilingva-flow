import type { SupabaseClient } from '@supabase/supabase-js'
import type { InterfaceLang, LearningLang } from '@/types/database'
import { DAILY_GOALS } from '@/lib/daily-goals'
import type { BackTSentence } from '@/types/back-translation'
import { localDate, markActivity } from '@/lib/server/activity'

// ============================================
// Back-T rules shared by the API routes.
// ============================================


/** Sentences (with their gloss) by id, in the order of `ids` */
export async function loadSentences(supabase: SupabaseClient, ids: string[]): Promise<Map<string, BackTSentence>> {
  const map = new Map<string, BackTSentence>()
  if (ids.length === 0) return map
  const { data, error } = await supabase
    .from('sentences')
    .select('id, sentence_text, sentence_parts(text, translation, order_index)')
    .in('id', ids)
  if (error) console.error('[back-t] sentences error:', error.message)
  for (const s of data ?? []) {
    const parts = [...((s.sentence_parts as { text: string; translation: string; order_index: number }[]) ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
    map.set(s.id, {
      id: s.id,
      sentence_text: s.sentence_text,
      chunks: parts.map((p) => ({ text: p.text, translation: p.translation })),
    })
  }
  return map
}

/**
 * Sentences the user has met (newest first) that are written for this
 * interface language — candidates for step 1.
 */
export async function candidateSentenceIds(
  supabase: SupabaseClient,
  userId: string,
  language: LearningLang,
  interfaceLanguage: InterfaceLang
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_sentences')
    .select('sentence_id, sentences!inner(interface_language)')
    .eq('user_id', userId)
    .eq('language', language)
    .eq('sentences.interface_language', interfaceLanguage)
    .order('first_seen_at', { ascending: false })
    .limit(100)
  if (error) console.error('[back-t] candidates error:', error.message)
  return (data ?? []).map((r) => r.sentence_id as string)
}

/**
 * The Back-T ring is done for today when nothing is waiting for step 2 and
 * today's new sentences are translated: the daily goal, or fewer when the
 * user has no more unused sentences.
 */
export async function updateBackTRing(
  supabase: SupabaseClient,
  userId: string,
  language: LearningLang,
  interfaceLanguage: InterfaceLang,
  tz: string
) {
  const today = localDate(tz)
  const { data } = await supabase
    .from('back_translations')
    .select('sentence_id, forward_date, back_text')
    .eq('user_id', userId)
    .eq('language', language)

  const rows = data ?? []
  const due = rows.filter((r) => !r.back_text && r.forward_date < today).length
  const forwardedToday = rows.filter((r) => r.forward_date === today).length
  const used = new Set(rows.map((r) => r.sentence_id))
  const available = (await candidateSentenceIds(supabase, userId, language, interfaceLanguage)).filter((id) => !used.has(id)).length
  const goal = Math.min(DAILY_GOALS.backTranslations, forwardedToday + available)

  if (due === 0 && forwardedToday >= goal && (forwardedToday > 0 || rows.some((r) => r.back_text))) {
    await markActivity(userId, language, tz, { backTranslationDone: true })
  }
}

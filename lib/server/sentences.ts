import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { localized } from '@/lib/languages'
import { AI_MODELS, generateJson } from '@/lib/server/ai'
import { SENTENCES_SCHEMA, sentencesPrompt } from '@/lib/server/prompts'
import { localDate } from '@/lib/server/activity'
import { getFocusHints } from '@/lib/server/reports'
import type { GeneratedSentence, InterfaceLang, LearningLang, Level } from '@/types/database'

// ============================================
// Sentence sets: the sentences the user works through on the daily path.
// The current set is the user's latest set for a learning + interface
// language. Sets are written with the service role (users can only read them).
// ============================================

export const SENTENCE_FIELDS =
  'id, sentence_text, translation, topic_id, custom_topic, language, interface_language, sentence_parts(*)'

export interface SentenceSet {
  id: string
  level: Level
  created_on: string
  completed_on: string | null
  essay_topic: string | null
  essay_words: { text: string; translation: string }[] | null
}

const SET_FIELDS = 'id, level, created_on, completed_on, essay_topic, essay_words'

export async function getCurrentSet(
  supabase: SupabaseClient,
  userId: string,
  language: LearningLang,
  interfaceLanguage: InterfaceLang
): Promise<SentenceSet | null> {
  const { data, error } = await supabase
    .from('sentence_sets')
    .select(SET_FIELDS)
    .eq('user_id', userId)
    .eq('language', language)
    .eq('interface_language', interfaceLanguage)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) console.error('[sets] current error:', error.message)
  return (data as SentenceSet | null) ?? null
}

/** Starts a new set: the previous set's sentences stop being active */
export async function createSet(
  supabase: SupabaseClient,
  opts: { userId: string; language: LearningLang; interfaceLanguage: InterfaceLang; level: Level; tz: string; previousSetId?: string }
): Promise<SentenceSet | null> {
  const admin = createAdminClient()
  if (opts.previousSetId) {
    await supabase.from('user_sentences').update({ is_active: false }).eq('user_id', opts.userId).eq('set_id', opts.previousSetId)
  }
  const { data, error } = await admin
    .from('sentence_sets')
    .insert({
      user_id: opts.userId,
      language: opts.language,
      interface_language: opts.interfaceLanguage,
      level: opts.level,
      created_on: localDate(opts.tz),
    })
    .select(SET_FIELDS)
    .single()
  if (error) {
    console.error('[sets] create error:', error.message)
    return null
  }
  return data as SentenceSet
}

/** Sentences of a set, with parts, in the order they were added */
export async function loadSetSentences(supabase: SupabaseClient, userId: string, setId: string) {
  const { data: rows } = await supabase
    .from('user_sentences')
    .select('sentence_id')
    .eq('user_id', userId)
    .eq('set_id', setId)
    .order('first_seen_at', { ascending: true })
  const ids = (rows ?? []).map((r) => r.sentence_id as string)
  if (ids.length === 0) return []
  const { data } = await supabase.from('sentences').select(SENTENCE_FIELDS).in('id', ids)
  const byId = new Map((data ?? []).map((s) => [s.id, s]))
  return ids.map((id) => byId.get(id)).filter(Boolean)
}

/** Adds sentences to the user's set */
export async function linkSentences(
  supabase: SupabaseClient,
  userId: string,
  language: LearningLang,
  setId: string,
  sentenceIds: string[]
) {
  if (sentenceIds.length === 0) return
  const { error } = await supabase.from('user_sentences').insert(
    sentenceIds.map((sentence_id) => ({
      user_id: userId,
      sentence_id,
      language,
      set_id: setId,
      understood_parts: [],
      is_active: true,
    }))
  )
  if (error) console.error('[sentences] link error:', error.message)
}

export async function fetchUserProgress(supabase: SupabaseClient, userId: string, sentenceIds: string[]) {
  if (sentenceIds.length === 0) return {}
  const { data, error } = await supabase
    .from('user_sentences')
    .select('sentence_id, understood_parts, all_understood, fully_mastered')
    .eq('user_id', userId)
    .in('sentence_id', sentenceIds)
  if (error) console.error('[sentences] progress error:', error.message)
  return Object.fromEntries((data ?? []).map((row) => [row.sentence_id, row]))
}

/** New sentences the user hasn't seen in the last 24 hours (AI cost guard) */
export async function sentencesLinkedLastDay(supabase: SupabaseClient, userId: string, language: LearningLang) {
  const { count } = await supabase
    .from('user_sentences')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('language', language)
    .gte('first_seen_at', new Date(Date.now() - 86_400_000).toISOString())
  return count ?? 0
}

/**
 * Marks the set completed when every sentence in it is fully understood (and
 * un-marks it if the user un-ticks a part on the same day).
 */
export async function updateSetCompletion(supabase: SupabaseClient, userId: string, setId: string, tz: string) {
  const { data: rows } = await supabase
    .from('user_sentences')
    .select('all_understood')
    .eq('user_id', userId)
    .eq('set_id', setId)
  const { data: set } = await supabase.from('sentence_sets').select('completed_on').eq('id', setId).maybeSingle()
  if (!rows || rows.length === 0 || !set) return

  const complete = rows.every((r) => r.all_understood)
  const today = localDate(tz)
  // A set completed on an earlier day stays completed (the next set may already be open)
  if (set.completed_on && set.completed_on < today) return
  const completed_on = complete ? set.completed_on ?? today : null
  if (completed_on !== set.completed_on) {
    await createAdminClient().from('sentence_sets').update({ completed_on }).eq('id', setId)
  }
}

/** Unseen sentences from the shared pool, topped up with freshly generated ones */
export async function getNewSentences(
  supabase: SupabaseClient,
  opts: {
    userId: string
    language: LearningLang
    level: Level
    interfaceLanguage: InterfaceLang
    count: number
    topicId?: string
    customTopic?: string
  }
) {
  const { userId, language, level, interfaceLanguage, count, topicId, customTopic } = opts
  if (count <= 0) return []

  const { data: seenData } = await supabase
    .from('user_sentences')
    .select('sentence_id')
    .eq('user_id', userId)
    .eq('language', language)
  const seen = new Set((seenData ?? []).map((r) => r.sentence_id))

  let query = supabase
    .from('sentences')
    .select(SENTENCE_FIELDS)
    .eq('language', language)
    .eq('interface_language', interfaceLanguage)
    .eq('level', level)
  if (topicId) query = query.eq('topic_id', topicId)
  if (customTopic) query = query.eq('custom_topic', customTopic)
  const { data: pool } = await query

  const result = (pool ?? []).filter((s) => !seen.has(s.id)).slice(0, count)
  const toGenerate = count - result.length
  if (toGenerate <= 0) return result

  let topicName = customTopic ?? ''
  if (!topicName && topicId) {
    const { data: topic } = await supabase.from('topics').select('name').eq('id', topicId).single()
    if (topic) topicName = localized(topic.name, interfaceLanguage)
  }

  const focus = await getFocusHints(supabase, userId, language)
  const generated = await generateSentences({ language, level, topicName, interfaceLanguage, count: toGenerate, focus })

  // The shared pool is written with the service role
  const admin = createAdminClient()
  for (const s of generated) {
    const { data: row } = await admin
      .from('sentences')
      .insert({
        language,
        level,
        topic_id: topicId ?? null,
        custom_topic: customTopic ?? null,
        sentence_text: s.sentence_text,
        interface_language: interfaceLanguage,
        translation: s.translation,
        ai_model: 'gemini',
        times_shown: 0,
      })
      .select('id')
      .single()
    if (!row) continue

    await admin.from('sentence_parts').insert(
      s.parts.map((part, index) => ({
        sentence_id: row.id,
        order_index: index,
        text: part.text,
        translation: part.translation,
        pronunciation: part.pronunciation,
        explanation: part.explanation ?? null,
        tip: part.tip ?? null,
      }))
    )
    const { data: full } = await admin.from('sentences').select(SENTENCE_FIELDS).eq('id', row.id).single()
    if (full) result.push(full)
  }
  return result
}

async function generateSentences(params: {
  language: LearningLang
  level: Level
  topicName: string
  interfaceLanguage: InterfaceLang
  count: number
  focus: string[]
}): Promise<GeneratedSentence[]> {
  try {
    const parsed = await generateJson<GeneratedSentence[]>(AI_MODELS.sentences, sentencesPrompt(params), SENTENCES_SCHEMA)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s) => s.sentence_text && s.translation && Array.isArray(s.parts) && s.parts.length > 0)
      .slice(0, params.count)
  } catch (err) {
    console.error('[sentences] AI error:', err)
    return []
  }
}

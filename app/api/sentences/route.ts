import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LIMITS, isAppAdmin, sanitizePromptText } from '@/lib/server/access'
import { SentencesBody, parseBody } from '@/lib/server/validation'
import { localDate } from '@/lib/server/activity'
import {
  createSet,
  fetchUserProgress,
  getCurrentSet,
  getNewSentences,
  linkSentences,
  loadSetSentences,
  sentencesLinkedLastDay,
  type SentenceSet,
} from '@/lib/server/sentences'
import { SET_MAX, SET_SIZE } from '@/lib/daily-goals'

// AI generation takes 10–25 s; allow for a slow primary model plus the fallback
export const maxDuration = 120

/**
 * The current sentence set.
 *   {}             → the current set; a new set opens the day after the current one is completed
 *   { add_count }  → add sentences to the current set ("+ add one more")
 *   { skip: true } → replace the current set with a new one
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, SentencesBody)
    if (parsed.error) return parsed.error
    const { language, level, topic_id, custom_topic, interface_language, skip, add_count, tz } = parsed.data

    const admin = await isAppAdmin(user.id)
    // Custom topics end up in the shared sentence pool, so only admins may set them
    const customTopic = admin && custom_topic ? sanitizePromptText(custom_topic, LIMITS.customTopicMaxChars) || undefined : undefined
    const remaining = admin ? Infinity : LIMITS.sentencesPerDay - (await sentencesLinkedLastDay(supabase, user.id, language))
    const maxSize = admin ? 100 : SET_MAX
    const limitReached = () =>
      NextResponse.json({ error: 'Daily limit reached', code: 'limit_reached' }, { status: 429 })

    const newSentences = (count: number) =>
      getNewSentences(supabase, {
        userId: user.id, language, level, interfaceLanguage: interface_language, count,
        topicId: topic_id, customTopic,
      })

    const today = localDate(tz)
    let set = await getCurrentSet(supabase, user.id, language, interface_language)
    let generated = false

    const openNewSet = async () => {
      if (remaining < 1) return false
      const next = await createSet(supabase, {
        userId: user.id, language, interfaceLanguage: interface_language, level, tz, previousSetId: set?.id,
      })
      if (!next) return false
      const fresh = await newSentences(Math.min(SET_SIZE, remaining))
      await linkSentences(supabase, user.id, language, next.id, fresh.map((s) => s.id))
      set = next
      generated = fresh.length > 0
      return true
    }

    if (skip) {
      if (remaining < SET_SIZE) return limitReached()
      await openNewSet()
    } else if (add_count && set) {
      const current = await loadSetSentences(supabase, user.id, set.id)
      const count = Math.min(admin ? Math.min(add_count, 20) : 1, remaining, maxSize - current.length)
      if (count <= 0) return limitReached()
      const fresh = await newSentences(count)
      await linkSentences(supabase, user.id, language, set.id, fresh.map((s) => s.id))
      generated = fresh.length > 0
      // A new sentence makes a set completed today unfinished again
      if (fresh.length > 0 && set.completed_on === today) {
        await createAdminClient().from('sentence_sets').update({ completed_on: null }).eq('id', set.id)
        set = { ...set, completed_on: null }
      }
    } else if (!set || (set.completed_on && set.completed_on < today)) {
      // No set yet, or the current one was finished on an earlier day
      if (!(await openNewSet()) && !set) return limitReached()
    }

    return NextResponse.json(await setPayload(supabase, user.id, set!, today, maxSize, generated))
  } catch (error) {
    console.error('Sentences error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 })
  }
}

async function setPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  set: SentenceSet,
  today: string,
  maxSize: number,
  generated: boolean
) {
  const sentences = await loadSetSentences(supabase, userId, set.id)
  const userProgress = await fetchUserProgress(supabase, userId, sentences.map((s: any) => s.id))
  return {
    sentences,
    userProgress,
    generated,
    set: {
      id: set.id,
      size: sentences.length,
      max: maxSize,
      /** Completed today: the next set opens tomorrow */
      completedToday: set.completed_on === today,
    },
  }
}

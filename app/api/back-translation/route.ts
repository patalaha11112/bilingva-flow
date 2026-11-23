import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseQuery, BackTQuery } from '@/lib/server/validation'
import { localDate } from '@/lib/server/activity'
import {
  BACK_T_MAX_PER_DAY,
  candidateSentenceIds,
  dailyTarget,
  loadSentences,
} from '@/lib/server/back-translation'
import type { BackTFeedback, BackTState } from '@/types/back-translation'

/** Today's Back-T: sentences waiting for step 2, today's step 1, and today's results */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = parseQuery(request.nextUrl.searchParams, BackTQuery)
    if (parsed.error) return parsed.error
    const { language, interface_lang: interfaceLang, level, tz, count } = parsed.data

    const today = localDate(tz)
    const target = dailyTarget(level)
    const wanted = Math.min(Math.max(count ?? target, target), BACK_T_MAX_PER_DAY)

    const { data: rowsData, error } = await supabase
      .from('back_translations')
      .select('id, sentence_id, forward_text, forward_date, back_text, back_at, ai_feedback')
      .eq('user_id', user.id)
      .eq('language', language)
      .eq('interface_language', interfaceLang)
      .order('forward_at', { ascending: true })
    if (error) console.error('[back-t] list error:', error.message)
    const rows = rowsData ?? []

    const due = rows.filter((r) => !r.back_text && r.forward_date < today)
    const forwardedToday = rows.filter((r) => r.forward_date === today)
    const doneToday = rows.filter((r) => r.back_at && localDate(tz, new Date(r.back_at)) === today)

    // New sentences for step 1, never used in Back-T before
    const used = new Set(rows.map((r) => r.sentence_id))
    const needed = Math.max(0, wanted - forwardedToday.length)
    const candidates = (await candidateSentenceIds(supabase, user.id, language, interfaceLang))
      .filter((id) => !used.has(id))
    const pendingIds = candidates.slice(0, needed)

    const sentences = await loadSentences(supabase, [
      ...forwardedToday.map((r) => r.sentence_id),
      ...doneToday.map((r) => r.sentence_id),
      ...pendingIds,
    ])

    const state: BackTState = {
      target,
      max: BACK_T_MAX_PER_DAY,
      // Only the user's own text: the original stays hidden until step 2 is done
      due: due.map((r) => ({ id: r.id, forward_text: r.forward_text, forward_date: r.forward_date })),
      today: [
        ...forwardedToday
          .filter((r) => sentences.has(r.sentence_id))
          .map((r) => ({ id: r.id, sentence: sentences.get(r.sentence_id)!, forward_text: r.forward_text })),
        ...pendingIds
          .filter((id) => sentences.has(id))
          .map((id) => ({ id: null, sentence: sentences.get(id)!, forward_text: null })),
      ],
      done: doneToday
        .filter((r) => sentences.has(r.sentence_id) && r.ai_feedback)
        .map((r) => ({
          id: r.id,
          forward_text: r.forward_text,
          back_text: r.back_text!,
          feedback: r.ai_feedback as BackTFeedback,
          sentence: sentences.get(r.sentence_id)!,
        })),
      noMoreSentences: candidates.length < needed,
    }
    return NextResponse.json(state)
  } catch (err) {
    console.error('[back-t] GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

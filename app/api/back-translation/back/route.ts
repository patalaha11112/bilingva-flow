import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseBody, BackTBackBody } from '@/lib/server/validation'
import { localDate } from '@/lib/server/activity'
import { sanitizePromptText } from '@/lib/server/access'
import { AI_MODELS, generateJson } from '@/lib/server/ai'
import { BACK_TRANSLATION_SCHEMA, backTranslationPrompt } from '@/lib/server/prompts'
import { loadSentences, updateBackTRing } from '@/lib/server/back-translation'
import type { BackTDone, BackTFeedback } from '@/types/back-translation'
import type { InterfaceLang, LearningLang } from '@/types/database'

export const maxDuration = 120

/** Step 2: the user's translation back into the learning language, checked against the original */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, BackTBackBody)
    if (parsed.error) return parsed.error
    const { id, text, level, tz } = parsed.data

    // RLS: only the user's own rows are visible
    const { data: row } = await supabase
      .from('back_translations')
      .select('id, sentence_id, language, interface_language, forward_text, forward_date, back_text')
      .eq('id', id)
      .maybeSingle()
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (row.back_text) return NextResponse.json({ error: 'Already done', code: 'already_done' }, { status: 409 })
    if (row.forward_date >= localDate(tz)) {
      return NextResponse.json({ error: 'Opens tomorrow', code: 'too_early' }, { status: 409 })
    }

    const sentence = (await loadSentences(supabase, [row.sentence_id])).get(row.sentence_id)
    if (!sentence) return NextResponse.json({ error: 'Sentence not found' }, { status: 404 })

    const language = row.language as LearningLang
    const feedback = await generateJson<BackTFeedback>(
      AI_MODELS.backTranslation,
      backTranslationPrompt({
        language,
        interfaceLanguage: row.interface_language as InterfaceLang,
        level,
        original: sentence.sentence_text,
        forward: sanitizePromptText(row.forward_text, 1000),
        attempt: sanitizePromptText(text, 1000),
      }),
      BACK_TRANSLATION_SCHEMA
    )

    const { error } = await createAdminClient()
      .from('back_translations')
      .update({
        back_text: text,
        back_at: new Date().toISOString(),
        ai_score: Math.min(10, Math.max(1, Math.round(feedback.score))),
        ai_feedback: feedback,
      })
      .eq('id', row.id)
      .is('back_text', null)
    if (error) {
      console.error('[back-t] back update error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await updateBackTRing(supabase, user.id, language, row.interface_language as InterfaceLang, tz)

    const result: BackTDone = { id: row.id, forward_text: row.forward_text, back_text: text, feedback, sentence }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[back-t] back error:', err)
    return NextResponse.json({ error: 'AI check failed', code: 'ai_failed' }, { status: 502 })
  }
}

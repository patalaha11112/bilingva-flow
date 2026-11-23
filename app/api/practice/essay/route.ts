import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'
import { AI_MODELS, generateJson } from '@/lib/server/ai'
import { ESSAY_SCHEMA, essayPrompt } from '@/lib/server/prompts'
import { getMessages } from '@/locales'
import { LIMITS, isAppAdmin, sanitizePromptText } from '@/lib/server/access'
import { EssayBody, parseBody } from '@/lib/server/validation'
import { markActivity } from '@/lib/server/activity'

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// AI generation takes 10–25 s; allow for a slow primary model plus the fallback
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    // Admin client only for writes to tables users can read but not write (scores, activity)
    const supabaseAdmin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, EssayBody)
    if (parsed.error) return parsed.error
    const { content, topic, language, level, interface_language, is_bonus, tz } = parsed.data

    const admin = await isAppAdmin(user.id)
    if (!admin) {
      if (content.length > LIMITS.essayMaxChars) {
        return NextResponse.json({ error: 'Essay is too long', code: 'too_long' }, { status: 413 })
      }
      const dayStart = new Date()
      dayStart.setUTCHours(0, 0, 0, 0)
      const { count: essaysToday } = await supabase
        .from('user_essays')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', dayStart.toISOString())
      if ((essaysToday ?? 0) >= LIMITS.essaysPerDay) {
        return NextResponse.json({ error: 'Daily essay limit reached', code: 'limit_reached' }, { status: 429 })
      }
    }
    const safeTopic = sanitizePromptText(topic, 200)

    let aiScore = 7
    let aiFeedback = ''
    let wordsUsed: string[] = []
    let aiImprovements: { original: string; better: string; why: string }[] = []
    let aiAlternatives: { phrase: string; options: string[] }[] = []
    let aiFunFact = ''

    try {
      const parsed = await generateJson<{
        score: number; feedback: string; words_used: string[]
        improvements: typeof aiImprovements; alternatives: typeof aiAlternatives; fun_fact: string
      }>(
        AI_MODELS.essay,
        essayPrompt({ language, interfaceLanguage: interface_language, level, topic: safeTopic, content }),
        ESSAY_SCHEMA
      )
      aiScore = Math.min(10, Math.max(1, Number(parsed.score) || 7))
      aiFeedback = String(parsed.feedback ?? '')
      wordsUsed = Array.isArray(parsed.words_used) ? parsed.words_used.map(String) : []
      aiImprovements = Array.isArray(parsed.improvements) ? parsed.improvements : []
      aiAlternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives : []
      aiFunFact = String(parsed.fun_fact ?? '')
    } catch (err) {
      console.error('[essay] AI error:', err)
      aiFeedback = getMessages(interface_language).server.essayFallbackFeedback
    }

    const wordCount = countWords(content)

    // Save essay
    const { data: essay, error: essayError } = await supabaseAdmin
      .from('user_essays')
      .insert({
        user_id: user.id,
        language,
        topic,
        content,
        word_count: wordCount,
        ai_feedback: aiFeedback,
        ai_score: aiScore,
        words_used: wordsUsed,
        is_bonus: is_bonus ?? false,
      })
      .select()
      .single()

    if (essayError) {
      console.error('Essay insert error:', essayError)
      return NextResponse.json({ error: 'Failed to save essay', detail: essayError.message, code: essayError.code }, { status: 500 })
    }

    // Today's essay ring (bonus essays don't count)
    if (!is_bonus) await markActivity(user.id, language, tz, { essayDone: true })

    return NextResponse.json({
      essay,
      score: aiScore,
      feedback: aiFeedback,
      improvements: aiImprovements,
      alternatives: aiAlternatives,
      fun_fact: aiFunFact,
      word_count: wordCount,
    })
  } catch (err) {
    console.error('Essay route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

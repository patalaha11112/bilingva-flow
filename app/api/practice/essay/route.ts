import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'
import { getInterfaceLanguage, getLearningLanguage } from '@/lib/languages'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, topic, language, level, interface_language, is_bonus } = await request.json() as {
      content: string
      topic: string
      language: LearningLang
      level: Level
      interface_language: InterfaceLang
      is_bonus?: boolean
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const langName = getLearningLanguage(language).prompt.name
    const uiLang = getInterfaceLanguage(interface_language).promptName

    let aiScore = 7
    let aiFeedback = ''
    let wordsUsed: string[] = []
    let aiImprovements: { original: string; better: string; why: string }[] = []
    let aiAlternatives: { phrase: string; options: string[] }[] = []
    let aiFunFact = ''

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      const prompt = `You are an encouraging language teacher reviewing a student's essay written in ${langName}.

Student level: ${level}
Essay topic: "${topic}"
Respond in: ${uiLang}

Essay:
"""
${content}
"""

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "score": <integer 1-10>,
  "feedback": "<1-2 sentences of specific genuine praise about something concrete in this text>",
  "improvements": [
    {
      "original": "<exact phrase from the essay>",
      "better": "<corrected or improved version in ${langName}>",
      "why": "<1 sentence explanation in ${uiLang}>"
    }
  ],
  "alternatives": [
    {
      "phrase": "<phrase the student used>",
      "options": ["<richer alternative in ${langName}>", "<another alternative>"]
    }
  ],
  "fun_fact": "<one genuinely interesting or surprising fact about this topic or about ${langName}, in ${uiLang}>",
  "words_used": ["list", "of", "${langName}", "words", "detected", "in", "the", "essay"]
}

Rules:
- improvements: 1–3 items, only for real grammar or vocabulary mistakes. Empty array if no mistakes.
- alternatives: 1–2 items showing richer ways to express what the student already wrote.
- fun_fact: always include. Make it specific and engaging, not generic.`

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      const parsed = JSON.parse(jsonStr)
      aiScore = Math.min(10, Math.max(1, Number(parsed.score) || 7))
      aiFeedback = String(parsed.feedback ?? '')
      wordsUsed = Array.isArray(parsed.words_used) ? parsed.words_used.map(String) : []
      aiImprovements = Array.isArray(parsed.improvements) ? parsed.improvements : []
      aiAlternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives : []
      aiFunFact = String(parsed.fun_fact ?? '')
    } catch {
      aiFeedback = interface_language === 'ru' ? 'Отличная работа! Продолжай в том же духе.'
                 : interface_language === 'es' ? '¡Excelente trabajo! Sigue así.'
                 : 'Great work! Keep it up.'
    }

    const { week, year } = getISOWeek(new Date())
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
        week_number: week,
        year,
      })
      .select()
      .single()

    if (essayError) {
      console.error('Essay insert error:', essayError)
      return NextResponse.json({ error: 'Failed to save essay', detail: essayError.message, code: essayError.code }, { status: 500 })
    }

    // Update daily activity (only for non-bonus essays) — non-fatal
    if (!is_bonus) {
      try {
        const today = new Date().toISOString().split('T')[0]

        const { data: updated } = await supabaseAdmin
          .from('user_daily_activity')
          .update({ essay_done: true })
          .eq('user_id', user.id)
          .eq('language', language)
          .eq('date', today)
          .select('id')

        if (!updated?.length) {
          await supabaseAdmin
            .from('user_daily_activity')
            .insert({
              user_id: user.id,
              language,
              date: today,
              sentences_done: 0,
              dialog_done: false,
              essay_done: true,
              video_done: false,
              book_session: false,
              fully_complete: false,
            })
        }
      } catch (err) {
        console.error('Daily activity update failed (non-fatal):', err)
      }
    }

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

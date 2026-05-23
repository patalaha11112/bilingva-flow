import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'

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

    const langName = language === 'es' ? 'Spanish' : 'English'
    const uiLang = interface_language === 'ru' ? 'Russian'
                 : interface_language === 'es' ? 'Spanish'
                 : 'English'

    let aiScore = 7
    let aiFeedback = ''
    let wordsUsed: string[] = []

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
  "feedback": "<2-3 sentences in ${uiLang}: start with specific genuine praise about something in the text, then one positive concrete tip if relevant. Never say what is missing.>",
  "words_used": ["list", "of", "${langName}", "words", "detected", "in", "the", "essay"]
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      const parsed = JSON.parse(jsonStr)
      aiScore = Math.min(10, Math.max(1, Number(parsed.score) || 7))
      aiFeedback = String(parsed.feedback ?? '')
      wordsUsed = Array.isArray(parsed.words_used) ? parsed.words_used.map(String) : []
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
      word_count: wordCount,
    })
  } catch (err) {
    console.error('Essay route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

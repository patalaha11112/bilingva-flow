import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InterfaceLang, LearningLang } from '@/types/database'
import { DEFAULT_INTERFACE_LANG, localized } from '@/lib/languages'
import { getMessages } from '@/locales'
import { getWeekStart, isInterfaceLang, isLearningLang } from '@/lib/server/access'

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') as LearningLang
    const interfaceLang = (searchParams.get('interface_lang') ?? DEFAULT_INTERFACE_LANG) as InterfaceLang

    if (!isLearningLang(language)) return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    const uiLang = isInterfaceLang(interfaceLang) ? interfaceLang : DEFAULT_INTERFACE_LANG

    const today = new Date().toISOString().split('T')[0]
    const { week, year } = getISOWeek(new Date())

    // Check if essay done today (non-bonus)
    const { data: todayActivity } = await supabase
      .from('user_daily_activity')
      .select('essay_done')
      .eq('user_id', user.id)
      .eq('language', language)
      .eq('date', today)
      .maybeSingle()

    const essayDoneToday = todayActivity?.essay_done ?? false

    // Find most practiced topic from this week's sentences
    let topic = ''

    const { data: userSentences } = await supabase
      .from('user_sentences')
      .select('sentence_id')
      .eq('user_id', user.id)
      .eq('language', language)
      .gte('first_seen_at', getWeekStart())
      .limit(50)

    if (userSentences && userSentences.length > 0) {
      const sentenceIds = userSentences.map(us => us.sentence_id)

      const { data: sentences } = await supabase
        .from('sentences')
        .select('topic_id')
        .in('id', sentenceIds)
        .not('topic_id', 'is', null)

      if (sentences && sentences.length > 0) {
        const topicCount: Record<string, number> = {}
        sentences.forEach(s => {
          if (s.topic_id) topicCount[s.topic_id] = (topicCount[s.topic_id] ?? 0) + 1
        })

        const topTopicId = Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0]

        if (topTopicId) {
          const { data: topicData } = await supabase
            .from('topics')
            .select('name')
            .eq('id', topTopicId)
            .single()

          if (topicData) {
            topic = localized(topicData.name, uiLang)
          }
        }
      }
    }

    if (!topic) {
      const options = getMessages(uiLang).server.fallbackTopics
      topic = options[new Date().getDay() % options.length]
    }

    // Suggested words: parts the user hasn't marked as understood (all recent sentences)
    let suggestedWords: { text: string; translation: string }[] = []

    const { data: weekUserSentences } = await supabase
      .from('user_sentences')
      .select('sentence_id, understood_parts')
      .eq('user_id', user.id)
      .eq('language', language)
      .order('first_seen_at', { ascending: false })
      .limit(30)

    if (weekUserSentences && weekUserSentences.length > 0) {
      const understoodMap: Record<string, string[]> = {}
      for (const us of weekUserSentences) {
        understoodMap[us.sentence_id] = (us.understood_parts as string[]) ?? []
      }

      const sentenceIds = weekUserSentences.map(us => us.sentence_id)
      const { data: allParts, error: partsError } = await supabase
        .from('sentence_parts')
        .select('id, sentence_id, text, translation, sentences!inner(interface_language)')
        .in('sentence_id', sentenceIds)
        .eq('sentences.interface_language', uiLang)
        .order('order_index')

      if (partsError) console.error('[topic] sentence_parts error:', partsError.message)

      if (allParts) {
        const seen = new Set<string>()
        for (const p of allParts) {
          if (suggestedWords.length >= 8) break
          const understood = understoodMap[p.sentence_id] ?? []
          if (understood.includes(p.id)) continue
          const lc = p.text.toLowerCase()
          if (seen.has(lc)) continue
          seen.add(lc)
          suggestedWords.push({ text: p.text, translation: p.translation })
        }
      }
    }

    return NextResponse.json({
      topic,
      suggested_words: suggestedWords,
      essay_done_today: essayDoneToday,
      week_number: week,
      year,
    })
  } catch (err) {
    console.error('Topic route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

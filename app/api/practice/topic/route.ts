import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { InterfaceLang, LearningLang } from '@/types/database'
import { DEFAULT_INTERFACE_LANG } from '@/lib/languages'

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

const FALLBACK_TOPICS: Record<InterfaceLang, string[]> = {
  ru: ['Мой обычный день', 'Мои увлечения', 'Моя семья', 'Еда которую я люблю', 'Моё любимое место'],
  en: ['My typical day', 'My hobbies', 'My family', 'Food I love', 'My favourite place'],
  es: ['Mi día típico', 'Mis pasatiempos', 'Mi familia', 'Comida que amo', 'Mi lugar favorito'],
}

// Monday 00:00 UTC of the current week (user_sentences has no week columns)
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() || 7) - 1))
  return d.toISOString()
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') as LearningLang
    const interfaceLang = (searchParams.get('interface_lang') ?? DEFAULT_INTERFACE_LANG) as InterfaceLang

    if (!language) return NextResponse.json({ error: 'language is required' }, { status: 400 })

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
            .select('name_ru, name_en, name_es')
            .eq('id', topTopicId)
            .single()

          if (topicData) {
            topic = interfaceLang === 'ru' ? topicData.name_ru
                  : interfaceLang === 'es' ? topicData.name_es
                  : topicData.name_en
          }
        }
      }
    }

    if (!topic) {
      const options = FALLBACK_TOPICS[interfaceLang] ?? FALLBACK_TOPICS[DEFAULT_INTERFACE_LANG]
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
        .select('id, sentence_id, text, translation_ru, translation_en')
        .in('sentence_id', sentenceIds)
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
          const translation = interfaceLang === 'ru'
            ? p.translation_ru
            : ((p.translation_en as string | null) ?? p.translation_ru)
          suggestedWords.push({ text: p.text, translation })
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMessages } from '@/locales'
import { localDate } from '@/lib/server/activity'
import { TopicQuery, parseQuery } from '@/lib/server/validation'
import { getCurrentSet, loadSetSentences } from '@/lib/server/sentences'
import { AI_MODELS, generateJson } from '@/lib/server/ai'
import { ESSAY_TOPIC_SCHEMA, essayTopicPrompt } from '@/lib/server/prompts'
import { getFocusHints } from '@/lib/server/reports'

export const maxDuration = 60

type Word = { text: string; translation: string }

/** Essay assignment for the current sentence set: a topic and words from its sentences */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = parseQuery(request.nextUrl.searchParams, TopicQuery)
    if (parsed.error) return parsed.error
    const { language, interface_lang: uiLang, tz } = parsed.data

    const { data: todayActivity } = await supabase
      .from('user_daily_activity')
      .select('essay_done')
      .eq('user_id', user.id)
      .eq('language', language)
      .eq('date', localDate(tz))
      .maybeSingle()

    let topic = ''
    let words: Word[] = []

    const set = await getCurrentSet(supabase, user.id, language, uiLang)
    if (set?.essay_topic) {
      topic = set.essay_topic
      words = set.essay_words ?? []
    } else if (set) {
      // First essay of this set: build the assignment once and keep it on the set
      const sentences = await loadSetSentences(supabase, user.id, set.id)
      if (sentences.length > 0) {
        try {
          const result = await generateJson<{ topic: string; words: Word[] }>(
            AI_MODELS.essayTopic,
            essayTopicPrompt({
              language,
              interfaceLanguage: uiLang,
              level: set.level,
              sentences: sentences.map((s: any) => ({ text: s.sentence_text, translation: s.translation })),
              focus: await getFocusHints(supabase, user.id, language),
            }),
            ESSAY_TOPIC_SCHEMA
          )
          topic = result.topic.trim()
          words = (result.words ?? []).filter((w) => w.text && w.translation).slice(0, 8)
          if (topic) {
            await createAdminClient()
              .from('sentence_sets')
              .update({ essay_topic: topic, essay_words: words })
              .eq('id', set.id)
          }
        } catch (err) {
          console.error('[topic] AI error:', err)
        }
      }
    }

    if (!topic) {
      const options = getMessages(uiLang).server.fallbackTopics
      topic = options[new Date().getDay() % options.length]
    }

    return NextResponse.json({
      topic,
      suggested_words: words,
      essay_done_today: todayActivity?.essay_done ?? false,
    })
  } catch (err) {
    console.error('Topic route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

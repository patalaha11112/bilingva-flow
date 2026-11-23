import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBody, ViewBody } from '@/lib/server/validation'
import { localDate, markActivity } from '@/lib/server/activity'

/** The user opened a sentence's breakdown in training: counts once per sentence per day */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, ViewBody)
    if (parsed.error) return parsed.error
    const { sentence_id, language, tz } = parsed.data
    const today = localDate(tz)

    // Only the first view today counts (the update matches nothing otherwise)
    const { data } = await supabase
      .from('user_sentences')
      .update({ last_viewed_on: today, last_shown_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('sentence_id', sentence_id)
      .or(`last_viewed_on.is.null,last_viewed_on.neq.${today}`)
      .select('id')

    if (data && data.length > 0) {
      await markActivity(user.id, language, tz, { sentencesDone: 1 })
    }
    return NextResponse.json({ counted: !!data?.length })
  } catch (err) {
    console.error('[view] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

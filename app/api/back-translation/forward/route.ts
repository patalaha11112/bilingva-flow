import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseBody, BackTForwardBody } from '@/lib/server/validation'
import { localDate } from '@/lib/server/activity'
import { isAppAdmin } from '@/lib/server/access'
import { updateBackTRing } from '@/lib/server/back-translation'
import { BACK_T_MAX_PER_DAY } from '@/lib/daily-goals'

/** Step 1: save the user's translation of a sentence into their interface language */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, BackTForwardBody)
    if (parsed.error) return parsed.error
    const { sentence_id, text, language, interface_language, tz } = parsed.data
    const today = localDate(tz)

    // Only sentences the user has met, written for this interface language
    const { data: link } = await supabase
      .from('user_sentences')
      .select('sentence_id, sentences!inner(interface_language)')
      .eq('user_id', user.id)
      .eq('sentence_id', sentence_id)
      .eq('sentences.interface_language', interface_language)
      .maybeSingle()
    if (!link) return NextResponse.json({ error: 'Sentence not found' }, { status: 404 })

    if (!(await isAppAdmin(user.id))) {
      const { count } = await supabase
        .from('back_translations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('language', language)
        .eq('forward_date', today)
      if ((count ?? 0) >= BACK_T_MAX_PER_DAY) {
        return NextResponse.json({ error: 'Daily limit reached', code: 'limit_reached' }, { status: 429 })
      }
    }

    // Users can only read back_translations; the server writes them
    const { data: row, error } = await createAdminClient()
      .from('back_translations')
      .insert({
        user_id: user.id,
        sentence_id,
        language,
        interface_language,
        forward_text: text,
        forward_date: today,
      })
      .select('id, forward_text, forward_date')
      .single()

    if (error) {
      // unique (user_id, sentence_id): this sentence was already used
      const status = error.code === '23505' ? 409 : 500
      if (status === 500) console.error('[back-t] forward insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status })
    }

    await updateBackTRing(supabase, user.id, language, interface_language, tz)
    return NextResponse.json(row)
  } catch (err) {
    console.error('[back-t] forward error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

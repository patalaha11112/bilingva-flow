import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReportAnswerBody, parseBody } from '@/lib/server/validation'

/** The user answered the level suggestion (moved or stayed): don't ask again for this report */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, ReportAnswerBody)
    if (parsed.error) return parsed.error

    const { error } = await createAdminClient()
      .from('weekly_reports')
      .update({ level_suggestion_answered: true })
      .eq('id', parsed.data.id)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[report] answer error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

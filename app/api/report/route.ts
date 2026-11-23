import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportQuery, parseQuery } from '@/lib/server/validation'
import { ensureLastWeekReport, listReports } from '@/lib/server/reports'

// Building a report calls the AI once (10–25 s)
export const maxDuration = 120

/** The latest weekly report (last week's is built on the first request after the week ends) */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = parseQuery(request.nextUrl.searchParams, ReportQuery)
    if (parsed.error) return parsed.error
    const { language, interface_lang, level, tz, history } = parsed.data

    await ensureLastWeekReport(supabase, { userId: user.id, language, interfaceLanguage: interface_lang, level, tz })
    const reports = await listReports(supabase, user.id, language, history ? 12 : 1)

    return NextResponse.json({ latest: reports[0] ?? null, history: history ? reports.slice(1) : [] })
  } catch (err) {
    console.error('[report] GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

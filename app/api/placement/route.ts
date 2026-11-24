import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LIMITS, isAppAdmin } from '@/lib/server/access'
import { PlacementBody, PlacementQuery, parseBody, parseQuery } from '@/lib/server/validation'
import { getPlacementTest, gradePlacement, placementsLastDay } from '@/lib/server/placement'

// Building the sentence bank (first test of a language pair) or grading takes 10–40 s
export const maxDuration = 120

/** The test: one sentence per level to understand and three to translate */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = parseQuery(request.nextUrl.searchParams, PlacementQuery)
    if (parsed.error) return parsed.error
    const { language, interface_lang } = parsed.data

    const test = await getPlacementTest(supabase, { userId: user.id, language, interfaceLanguage: interface_lang })
    if (test.understand.length === 0) {
      return NextResponse.json({ error: 'Test unavailable', code: 'unavailable' }, { status: 503 })
    }
    return NextResponse.json(test)
  } catch (err) {
    console.error('[placement] GET error:', err)
    return NextResponse.json({ error: 'Test unavailable', code: 'unavailable' }, { status: 503 })
  }
}

/** Grades the answers: level, strengths, focus areas and the revised "about me" */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, PlacementBody)
    if (parsed.error) return parsed.error
    const body = parsed.data

    if (!(await isAppAdmin(user.id)) && (await placementsLastDay(supabase, user.id)) >= LIMITS.placementsPerDay) {
      return NextResponse.json({ error: 'Daily limit reached', code: 'limit_reached' }, { status: 429 })
    }

    const result = await gradePlacement(supabase, {
      userId: user.id,
      language: body.language,
      interfaceLanguage: body.interface_language,
      understand: body.understand,
      translations: body.translations,
      essay: body.essay ? body.essay.slice(0, LIMITS.essayMaxChars) : null,
    })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[placement] POST error:', err)
    return NextResponse.json({ error: 'Grading failed', code: 'ai_failed' }, { status: 502 })
  }
}

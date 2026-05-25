import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language')
    const level = searchParams.get('level')
    const interfaceLang = searchParams.get('interface_lang') ?? 'ru'

    if (!language || !level) {
      return NextResponse.json({ error: 'language and level required' }, { status: 400 })
    }

    const { data: tips } = await supabaseAdmin
      .from('level_tips')
      .select('tip_text, sort_order')
      .eq('language', language)
      .eq('level', level)
      .eq('interface_language', interfaceLang)
      .order('sort_order')

    if (!tips || tips.length === 0) {
      return NextResponse.json({ tip: null })
    }

    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    const tip = tips[dayOfYear % tips.length]

    return NextResponse.json({ tip: tip.tip_text })
  } catch (err) {
    console.error('Tips route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Deletes all of the user's learning data and settings, so the app starts
 * again from the welcome screen. The account and interface language stay.
 * Most of these tables are read-only for users, so the server deletes with
 * the service role — always filtered by the signed-in user's id.
 */
const USER_TABLES = [
  // Children first: user_sentences and back_translations point to sets and sentences
  'back_translations',
  'user_sentences',
  'sentence_sets',
  'user_essays',
  'user_daily_activity',
  'weekly_reports',
  'placement_results',
  'user_language_settings',
] as const

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id)
      if (error) {
        console.error(`[reset] ${table}:`, error.message)
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
      }
    }
    await admin.from('user_profiles').update({ about_me: null }).eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset] error:', err)
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}

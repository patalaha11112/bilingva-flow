import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// The user's current focus: from the newest weekly review or level test that
// has focus areas. A week with too little work for an analysis keeps the
// previous focus. Used by the home card and by the AI prompts (server).
// ============================================

export type FocusArea = { title: string; why: string; example: string; prompt_hint: string }
export type CurrentFocus = { source: 'test' | 'report'; created_at: string; areas: FocusArea[] }

/** Rows of each kind checked for focus areas (a few "too little work" weeks in a row) */
const LOOKBACK = 4

export async function getCurrentFocus(supabase: SupabaseClient, userId: string, language: string): Promise<CurrentFocus | null> {
  const [{ data: reports }, { data: tests }] = await Promise.all([
    supabase.from('weekly_reports').select('report, created_at')
      .eq('user_id', userId).eq('language', language)
      .order('created_at', { ascending: false }).limit(LOOKBACK),
    supabase.from('placement_results').select('result, created_at')
      .eq('user_id', userId).eq('language', language)
      .order('created_at', { ascending: false }).limit(LOOKBACK),
  ])
  const candidates: CurrentFocus[] = [
    ...(reports ?? []).map((r) => ({ source: 'report' as const, created_at: r.created_at, areas: (r.report as any)?.focus_areas ?? [] })),
    ...(tests ?? []).map((r) => ({ source: 'test' as const, created_at: r.created_at, areas: (r.result as any)?.focus_areas ?? [] })),
  ].filter((c) => c.areas.length > 0)
  candidates.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return candidates[0] ?? null
}

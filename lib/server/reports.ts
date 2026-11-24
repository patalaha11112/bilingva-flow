import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_MODELS, generateJson } from '@/lib/server/ai'
import { WEEKLY_REPORT_SCHEMA, weeklyReportPrompt } from '@/lib/server/prompts'
import { addDays, localDate, weekStartOf } from '@/lib/server/activity'
import { loadSentences } from '@/lib/server/back-translation'
import { DAILY_GOALS } from '@/lib/daily-goals'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'
import type { ReportContent, WeeklyReport, WeeklyStats } from '@/types/weekly-report'

// ============================================
// Weekly reports. The previous week (Monday–Sunday, user's time zone) is
// summed up on the first request on or after Monday. Written with the
// service role; users can only read their reports.
// ============================================

/** Below this many checked pieces of work, the week gets stats only, no AI analysis */
const MIN_EVIDENCE = 2

const REPORT_FIELDS = 'id, week_start, level_set, level_estimate, report, stats, level_suggestion_answered'

function toReport(row: any): WeeklyReport {
  const insufficient = !!row.report?.insufficient
  return {
    id: row.id,
    week_start: row.week_start,
    level_set: row.level_set,
    level_estimate: row.level_estimate,
    report: insufficient ? null : (row.report as ReportContent),
    stats: row.stats as WeeklyStats,
    level_suggestion_answered: row.level_suggestion_answered,
  }
}

export async function listReports(supabase: SupabaseClient, userId: string, language: LearningLang, limit = 12) {
  const { data } = await supabase
    .from('weekly_reports')
    .select(REPORT_FIELDS)
    .eq('user_id', userId)
    .eq('language', language)
    .order('week_start', { ascending: false })
    .limit(limit)
  return (data ?? []).map(toReport)
}

/** Patterns to practise: from the newest weekly report or level test of the last two weeks */
export async function getFocusHints(supabase: SupabaseClient, userId: string, language: LearningLang): Promise<string[]> {
  const since = new Date(Date.now() - 15 * 86_400_000).toISOString()
  const [{ data: report }, { data: test }] = await Promise.all([
    supabase
      .from('weekly_reports')
      .select('report, created_at')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('placement_results')
      .select('result, created_at')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const latest = test && (!report || test.created_at > report.created_at)
    ? (test.result as { focus_areas?: { prompt_hint: string }[] })
    : (report?.report as ReportContent | null)
  const areas = latest?.focus_areas ?? []
  return areas.map((a) => a.prompt_hint).filter(Boolean).slice(0, 3)
}

/** The report for last week: existing, freshly built, or null when the user wasn't active */
export async function ensureLastWeekReport(
  supabase: SupabaseClient,
  opts: { userId: string; language: LearningLang; interfaceLanguage: InterfaceLang; level: Level; tz: string }
): Promise<WeeklyReport | null> {
  const { userId, language, interfaceLanguage, level, tz } = opts
  const thisMonday = weekStartOf(localDate(tz))
  const weekStart = addDays(thisMonday, -7)
  const weekEnd = addDays(thisMonday, -1)
  const inWeek = (ts: string) => {
    const d = localDate(tz, new Date(ts))
    return d >= weekStart && d <= weekEnd
  }
  // Timestamps are filtered by the user's calendar day; fetch a margin for time zones
  const fromIso = `${addDays(weekStart, -1)}T00:00:00Z`
  const toIso = `${addDays(thisMonday, 1)}T00:00:00Z`

  const { data: existing } = await supabase
    .from('weekly_reports')
    .select(REPORT_FIELDS)
    .eq('user_id', userId)
    .eq('language', language)
    .eq('week_start', weekStart)
    .maybeSingle()
  if (existing) return toReport(existing)

  const { data: activity } = await supabase
    .from('user_daily_activity')
    .select('date, sentences_done, back_translation_done, essay_done')
    .eq('user_id', userId)
    .eq('language', language)
    .gte('date', weekStart)
    .lte('date', weekEnd)
  const days = activity ?? []
  if (days.length === 0) return null

  const [{ data: backRows }, { data: essayRows }, { count: setsCompleted }] = await Promise.all([
    supabase
      .from('back_translations')
      .select('sentence_id, back_text, back_at, ai_score, ai_feedback')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('back_at', fromIso)
      .lt('back_at', toIso),
    supabase
      .from('user_essays')
      .select('topic, content, ai_score, ai_details, created_at')
      .eq('user_id', userId)
      .eq('language', language)
      .gte('created_at', fromIso)
      .lt('created_at', toIso),
    supabase
      .from('sentence_sets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('language', language)
      .gte('completed_on', weekStart)
      .lte('completed_on', weekEnd),
  ])
  const backs = (backRows ?? []).filter((r) => r.back_at && inWeek(r.back_at))
  const essays = (essayRows ?? []).filter((r) => inWeek(r.created_at))

  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => typeof x === 'number')
    return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
  }
  const stats: WeeklyStats = {
    days_active: days.filter((d) => d.sentences_done > 0 || d.back_translation_done || d.essay_done).length,
    days_complete: days.filter((d) => d.sentences_done >= DAILY_GOALS.sentencesViewed && d.back_translation_done && d.essay_done).length,
    sentences_viewed: days.reduce((sum, d) => sum + (d.sentences_done ?? 0), 0),
    sets_completed: setsCompleted ?? 0,
    back_translations: backs.length,
    back_translation_avg: avg(backs.map((b) => b.ai_score)),
    essays: essays.length,
    essay_avg: avg(essays.map((e) => e.ai_score)),
  }

  let report: ReportContent | { insufficient: true } = { insufficient: true }
  let levelEstimate: Level | null = null

  if (backs.length + essays.length >= MIN_EVIDENCE) {
    const originals = await loadSentences(supabase, backs.map((b) => b.sentence_id))
    const previous = await supabase
      .from('weekly_reports')
      .select('report')
      .eq('user_id', userId)
      .eq('language', language)
      .eq('week_start', addDays(weekStart, -7))
      .maybeSingle()
    const previousFocus = ((previous.data?.report as ReportContent | null)?.focus_areas ?? []).map((f) => f.title)

    try {
      const content = await generateJson<ReportContent>(
        AI_MODELS.weeklyReport,
        weeklyReportPrompt({
          language,
          interfaceLanguage,
          levelSet: level,
          stats: { ...stats },
          backTranslations: backs.slice(0, 20).map((b) => ({
            original: originals.get(b.sentence_id)?.sentence_text ?? '',
            attempt: b.back_text ?? '',
            score: b.ai_score ?? 0,
            corrections: (b.ai_feedback as any)?.corrections ?? [],
          })),
          essays: essays.slice(0, 7).map((e) => ({
            topic: e.topic,
            excerpt: String(e.content).slice(0, 400),
            score: e.ai_score,
            improvements: (e.ai_details as any)?.improvements ?? [],
          })),
          previousFocus,
        }),
        WEEKLY_REPORT_SCHEMA,
        // The light model misjudges strengths; better to retry on the next visit
        { fallback: false }
      )
      report = content
      levelEstimate = content.level_estimate
    } catch (err) {
      // No report rather than a half one: the next visit tries again
      console.error('[report] AI error:', err)
      return null
    }
  }

  const { data: inserted, error } = await createAdminClient()
    .from('weekly_reports')
    .insert({
      user_id: userId,
      language,
      interface_language: interfaceLanguage,
      week_start: weekStart,
      level_set: level,
      level_estimate: levelEstimate,
      report,
      stats,
    })
    .select(REPORT_FIELDS)
    .single()

  if (error) {
    // Built in parallel by another request: return that one
    if (error.code === '23505') {
      const { data } = await supabase.from('weekly_reports').select(REPORT_FIELDS)
        .eq('user_id', userId).eq('language', language).eq('week_start', weekStart).maybeSingle()
      return data ? toReport(data) : null
    }
    console.error('[report] insert error:', error.message)
    return null
  }
  return toReport(inserted)
}

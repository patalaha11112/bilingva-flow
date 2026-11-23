'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/use-t'
import { useUser } from '@/hooks/use-user'
import { getTimeZone, weekRange } from '@/lib/format'
import { LEVELS } from '@/core/constants'
import { Button } from '@/components/ui/button'
import type { WeeklyReport, WeeklyStats } from '@/types/weekly-report'

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

/** Latest weekly report (last week's is built on the first request on or after Monday) */
export function useWeeklyReports({ history = false } = {}) {
  const { user, interfaceLang, learningLang, level, isLoading: userLoading } = useUser()
  const [latest, setLatest] = useState<WeeklyReport | null>(null)
  const [older, setOlder] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ language: learningLang, interface_lang: interfaceLang, level, tz: getTimeZone() })
      if (history) params.set('history', '1')
      const res = await fetch(`/api/report?${params}`)
      if (res.ok) {
        const data = await res.json() as { latest: WeeklyReport | null; history: WeeklyReport[] }
        setLatest(data.latest)
        setOlder(data.history)
      }
    } finally {
      setLoading(false)
    }
  }, [learningLang, interfaceLang, level, history])

  useEffect(() => {
    if (!userLoading && user) load()
  }, [userLoading, user, load])

  const markAnswered = (id: string) => {
    setLatest(r => r && r.id === id ? { ...r, level_suggestion_answered: true } : r)
    fetch('/api/report/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  return { latest, older, loading, markAnswered }
}

// ─────────────────────────────────────────────
// Home card
// ─────────────────────────────────────────────

export function WeeklyReportCard() {
  const { t, locale } = useT()
  const { latest, loading, markAnswered } = useWeeklyReports()

  if (loading || !latest) return null
  const r = latest.report

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">{t.report.title}</h2>
          <p className="text-xs text-muted-foreground/70">{weekRange(locale, latest.week_start)}</p>
        </div>
        {latest.level_estimate && <LevelBadge level={latest.level_estimate} />}
      </div>

      {r ? (
        <>
          <p className="text-sm font-medium leading-snug">{r.headline}</p>
          {r.focus_areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {r.focus_areas.map(f => (
                <span key={f.title} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  <Target className="h-3 w-3" />
                  {f.title}
                </span>
              ))}
            </div>
          )}
          <LevelSuggestion report={latest} onAnswered={markAnswered} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t.report.insufficient}</p>
      )}

      <Link href="/report" className="flex items-center gap-0.5 text-xs font-medium text-primary w-fit">
        {t.report.details} <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  )
}

// ─────────────────────────────────────────────
// Level suggestion ("looks like you're at B1 — move up?")
// ─────────────────────────────────────────────

export function LevelSuggestion({ report, onAnswered }: { report: WeeklyReport; onAnswered: (id: string) => void }) {
  const { t } = useT()
  const { level, learningLang, updateLevel } = useUser()
  const estimate = report.level_estimate
  const r = report.report

  // Only for a confident estimate, until answered, and while the user is still on the reported level
  if (!r || !estimate || estimate === report.level_set || r.confidence === 'low'
      || report.level_suggestion_answered || level !== report.level_set) return null

  const up = LEVELS.indexOf(estimate) > LEVELS.indexOf(report.level_set)

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
      <p className="flex items-start gap-2 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        {up ? t.report.suggestUp(estimate) : t.report.suggestDown(estimate)}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={async () => { await updateLevel(learningLang, estimate); onAnswered(report.id) }}>
          {t.report.move(estimate)}
        </Button>
        <Button size="sm" variant="outline" onClick={() => onAnswered(report.id)}>
          {t.report.stay}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Full report
// ─────────────────────────────────────────────

export function ReportBody({ report, onAnswered }: { report: WeeklyReport; onAnswered?: (id: string) => void }) {
  const { t } = useT()
  const r = report.report

  return (
    <div className="space-y-4">
      {r ? (
        <>
          <p className="text-base font-semibold leading-snug">{r.headline}</p>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>{t.report.levelNow}</Label>
                <p className="text-xs text-muted-foreground">{t.report.levelChosen(report.level_set)}</p>
              </div>
              {report.level_estimate && <LevelBadge level={report.level_estimate} large />}
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{r.level_comment}</p>
            {r.confidence === 'low' && <p className="text-xs text-muted-foreground">{t.report.lowConfidence}</p>}
            {onAnswered && <LevelSuggestion report={report} onAnswered={onAnswered} />}
          </Card>

          {r.strengths.length > 0 && (
            <Card>
              <Label>{t.report.strengths}</Label>
              {r.strengths.map((s, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="text-sm font-medium">✨ {s.title}</p>
                  <p className="text-xs italic text-muted-foreground">{s.example}</p>
                </div>
              ))}
            </Card>
          )}

          {r.focus_areas.length > 0 && (
            <Card className="border border-primary/20">
              <Label>{t.report.focus}</Label>
              {r.focus_areas.map((f, i) => (
                <div key={i} className="space-y-0.5">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <Target className="h-3.5 w-3.5" /> {f.title}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/80">{f.why}</p>
                  <p className="text-xs italic text-muted-foreground">{f.example}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t.report.focusHint}</p>
            </Card>
          )}

          {r.known.length > 0 && (
            <Card>
              <Label>{t.report.known}</Label>
              <ul className="space-y-1">
                {r.known.map((k, i) => <li key={i} className="text-sm text-foreground/80">✓ {k}</li>)}
              </ul>
            </Card>
          )}
        </>
      ) : (
        <Card><p className="text-sm text-muted-foreground">{t.report.insufficient}</p></Card>
      )}

      <StatsGrid stats={report.stats} />

      {r?.encouragement && <p className="text-sm leading-relaxed text-foreground/80">💪 {r.encouragement}</p>}
    </div>
  )
}

function StatsGrid({ stats }: { stats: WeeklyStats }) {
  const { t } = useT()
  const keys = ['days_active', 'days_complete', 'sets_completed', 'back_translations', 'back_translation_avg', 'essays', 'essay_avg'] as const
  return (
    <Card>
      <Label>{t.report.stats}</Label>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {keys.map(k => (
          <div key={k} className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tabular-nums">{stats[k] ?? '—'}</span>
            <span className="text-xs text-muted-foreground">{t.report.statLabels[k]}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function LevelBadge({ level, large }: { level: string; large?: boolean }) {
  return (
    <span className={cn(
      'rounded-xl bg-primary text-primary-foreground font-black tracking-tight',
      large ? 'px-3 py-1.5 text-2xl' : 'px-2.5 py-1 text-base'
    )}>
      {level}
    </span>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl bg-card shadow-sm p-4 space-y-3', className)}>{children}</section>
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/60">{children}</p>
}

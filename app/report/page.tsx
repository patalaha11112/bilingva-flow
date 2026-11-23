'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/use-t'
import { weekRange } from '@/lib/format'
import { PageHeader } from '@/components/page-header'
import { ReportBody, useWeeklyReports } from '@/components/weekly-report'
import { Skeleton } from '@/components/ui/skeleton'
import type { WeeklyReport } from '@/types/weekly-report'

export default function ReportPage() {
  const { t, locale } = useT()
  const { latest, older, loading, markAnswered } = useWeeklyReports({ history: true })

  return (
    <>
      <PageHeader title={t.report.title} />
      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-2/3 rounded-lg" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : !latest ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t.report.noReports}</p>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {weekRange(locale, latest.week_start)}
            </p>
            <ReportBody report={latest} onAnswered={markAnswered} />

            {older.length > 0 && (
              <section className="space-y-2 pt-2">
                <h2 className="text-sm font-medium text-muted-foreground">{t.report.history}</h2>
                {older.map(r => <HistoryItem key={r.id} report={r} />)}
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}

function HistoryItem({ report }: { report: WeeklyReport }) {
  const { locale } = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl bg-card shadow-sm">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="rounded-lg bg-muted px-2 py-0.5 text-sm font-bold">{report.level_estimate ?? '—'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{weekRange(locale, report.week_start)}</p>
          {report.report && <p className="truncate text-sm">{report.report.headline}</p>}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-4 pb-4"><ReportBody report={report} /></div>}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import type { WeekActivity } from '@/types/database'
import type { InterfaceLang } from '@/types/database'
import { t } from '@/lib/i18n'

interface WeekProgressProps {
  activity: WeekActivity[]
  lang: InterfaceLang
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export function WeekProgress({ activity, lang }: WeekProgressProps) {
  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{t('thisWeek', lang)}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--ring-blue)]" />
            <span>{t('legend_sentences', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--ring-green)]" />
            <span>{t('legend_dialog', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--ring-orange)]" />
            <span>{t('legend_video', lang)}</span>
          </div>
        </div>
      </div>

      {/* Rings */}
      <div className="flex items-center justify-between gap-1">
        {activity.map((day, index) => {
          const dayLabel = t(DAY_KEYS[index], lang)
          return (
            <div
              key={day.date}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl p-2 transition-all flex-1',
                day.is_today && 'bg-muted'
              )}
            >
              <DayRing day={day} />
              <span className={cn(
                'text-xs',
                day.is_today ? 'font-semibold' : 'text-muted-foreground'
              )}>
                {dayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayRing({ day }: { day: WeekActivity }) {
  const size = 40
  const strokeWidth = size * 0.12
  const center = size / 2

  const outerRadius = (size - strokeWidth) / 2
  const middleRadius = outerRadius - strokeWidth - 2
  const innerRadius = middleRadius - strokeWidth - 2

  const circ = (r: number) => 2 * Math.PI * r

  // Для fully_complete — все три кольца заполнены
  // Для partially — заполнено первое (sentences_done > 0 OR dialog_done)
  // Для пустых — ничего
  const sentenceFill = day.fully_complete || day.partially_complete
  const dialogFill = day.fully_complete
  const videoFill = day.fully_complete

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90"
    >
      {/* Backgrounds */}
      <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/50" />
      <circle cx={center} cy={center} r={middleRadius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/50" />
      <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/50" />

      {/* Active */}
      <circle
        cx={center} cy={center} r={outerRadius}
        fill="none" stroke="var(--ring-blue)" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ(outerRadius)}
        strokeDashoffset={sentenceFill ? 0 : circ(outerRadius)}
        className="transition-all duration-700 ease-out"
      />
      <circle
        cx={center} cy={center} r={middleRadius}
        fill="none" stroke="var(--ring-green)" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ(middleRadius)}
        strokeDashoffset={dialogFill ? 0 : circ(middleRadius)}
        className="transition-all duration-700 ease-out delay-100"
      />
      <circle
        cx={center} cy={center} r={innerRadius}
        fill="none" stroke="var(--ring-orange)" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ(innerRadius)}
        strokeDashoffset={videoFill ? 0 : circ(innerRadius)}
        className="transition-all duration-700 ease-out delay-200"
      />
    </svg>
  )
}

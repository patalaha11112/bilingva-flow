'use client'

import { cn } from '@/lib/utils'
import type { WeekActivity } from '@/types/database'
import { useT } from '@/hooks/use-t'
import { weekdaysShort } from '@/lib/format'

interface WeekProgressProps {
  activity: WeekActivity[]
}

export function WeekProgress({ activity }: WeekProgressProps) {
  const { t, locale } = useT()
  const dayLabels = weekdaysShort(locale)
  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{t.home.thisWeek}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--ring-blue)]" />
            <span>{t.home.legend.sentences}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--ring-green)]" />
            <span>{t.home.legend.backT}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--ring-orange)]" />
            <span>{t.home.legend.essay}</span>
          </div>
        </div>
      </div>

      {/* Rings */}
      <div className="flex items-center justify-between gap-1">
        {activity.map((day, index) => {
          const dayLabel = dayLabels[index]
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

  // Outer: sentences, middle: Back-T, inner: essay
  const sentenceFill = day.sentences
  const backTFill = day.back_translation
  const essayFill = day.essay

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
        strokeDashoffset={backTFill ? 0 : circ(middleRadius)}
        className="transition-all duration-700 ease-out delay-100"
      />
      <circle
        cx={center} cy={center} r={innerRadius}
        fill="none" stroke="var(--ring-orange)" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ(innerRadius)}
        strokeDashoffset={essayFill ? 0 : circ(innerRadius)}
        className="transition-all duration-700 ease-out delay-200"
      />
    </svg>
  )
}

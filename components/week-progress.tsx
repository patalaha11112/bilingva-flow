"use client"

import { ActivityRing } from "@/components/activity-ring"
import { cn } from "@/lib/utils"

interface DayProgress {
  day: string
  sentence: boolean
  writing: boolean
  video: boolean
}

interface WeekProgressProps {
  days: DayProgress[]
  currentDay: number
  onDayClick?: (index: number) => void
}

export function WeekProgress({ days, currentDay, onDayClick }: WeekProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">This week</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-ring-blue" />
            <span>Sentence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-ring-green" />
            <span>Writing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-ring-orange" />
            <span>Video</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        {days.map((day, index) => {
          const isToday = index === currentDay
          const allComplete = day.sentence && day.writing && day.video
          
          return (
            <button
              key={day.day}
              onClick={() => onDayClick?.(index)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-2 transition-all",
                isToday && "bg-muted",
                "hover:bg-muted/50"
              )}
            >
              <ActivityRing
                sentence={day.sentence}
                writing={day.writing}
                video={day.video}
                size={40}
                glowing={allComplete}
              />
              <span className={cn(
                "text-xs",
                isToday ? "font-medium" : "text-muted-foreground"
              )}>
                {day.day}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/hooks/use-t'
import { LEVELS } from '@/core/constants'
import type { Level } from '@/types/database'

/** A1–C2 with a one-line description each */
export function LevelList({ onChoose, disabled, current }: { onChoose: (level: Level) => void; disabled?: boolean; current?: Level }) {
  const { t } = useT()
  return (
    <div className="space-y-2">
      {LEVELS.map((level) => (
        <BigOption key={level} selected={current === level} disabled={disabled} onClick={() => onChoose(level)}>
          <span className="w-9 text-lg font-black tracking-tight">{level}</span>
          <span className="flex-1 text-left">
            <span className="block text-sm font-medium">{t.levels[level]}</span>
            <span className="block text-xs text-muted-foreground">{t.welcome.levelDescriptions[level]}</span>
          </span>
        </BigOption>
      ))}
    </div>
  )
}

export function BigOption({ selected, disabled, onClick, children }: {
  selected?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50',
        selected ? 'border-primary ring-1 ring-primary' : 'border-transparent hover:border-border'
      )}
    >
      {children}
    </button>
  )
}

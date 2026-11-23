'use client'

import Link from 'next/link'
import { Check, ChevronRight, MessageSquareText, PenLine, Repeat2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/use-t'
import { useUser } from '@/hooks/use-user'
import { DAILY_GOALS } from '@/lib/daily-goals'

/** The daily path Sentences → Back-T → Essay; the first unfinished step is highlighted */
export function TodayPlan() {
  const { t } = useT()
  const { today } = useUser()
  const plan = t.home.plan

  const steps = [
    {
      href: '/sentences',
      icon: MessageSquareText,
      title: plan.sentences,
      hint: plan.sentencesHint(today.sentencesViewed, DAILY_GOALS.sentencesViewed),
      done: today.sentencesViewed >= DAILY_GOALS.sentencesViewed,
      color: 'text-[var(--ring-blue)]',
    },
    { href: '/back-t', icon: Repeat2, title: plan.backT, hint: plan.backTHint, done: today.backTranslation, color: 'text-[var(--ring-green)]' },
    { href: '/essay', icon: PenLine, title: plan.essay, hint: plan.essayHint, done: today.essay, color: 'text-[var(--ring-orange)]' },
  ]
  const next = steps.findIndex(s => !s.done)

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground mb-1">
        {next === -1 ? plan.allDone : plan.title}
      </h2>
      {steps.map((step, i) => (
        <Link
          key={step.href}
          href={step.href}
          className={cn(
            'flex items-center gap-3 rounded-xl p-3 transition-colors active:scale-[0.99]',
            i === next ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-accent'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
            step.done ? 'bg-green-500 text-white' : 'bg-background'
          )}>
            {step.done ? <Check className="h-4 w-4" /> : <step.icon className={cn('h-4 w-4', step.color)} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold', step.done && 'text-muted-foreground')}>{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.hint}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ))}
    </section>
  )
}

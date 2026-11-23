'use client'

import Link from 'next/link'
import { ChevronRight, BookOpen, MessageSquare, PenLine, Video } from 'lucide-react'
import type { LearningLang, Level } from '@/types/database'
import { useT } from '@/hooks/use-t'
import { getLearningLanguage } from '@/lib/languages'

interface HomeTopSectionProps {
  learningLang: LearningLang
  level: Level
  stats: {
    sentences_completed: number
    dialogs_completed: number
    essays_completed: number
    videos_completed: number
  }
}

export function HomeTopSection({ learningLang, level, stats }: HomeTopSectionProps) {
  const { t, lang } = useT()
  return (
    <section className="flex gap-3">

      {/* Left card: language + level */}
      <div className="flex-1 rounded-2xl bg-card p-4 shadow-sm flex flex-col justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{t.home.learningLanguage}</p>
          <p className="text-base font-semibold">
            {getLearningLanguage(learningLang).flag} {getLearningLanguage(learningLang).name[lang]}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{t.home.yourLevel}</p>
          <p className="text-4xl font-black tracking-tight leading-none">{level}</p>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          {t.home.change} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Right card: stats */}
      <div className="flex-1 rounded-2xl bg-card p-4 shadow-sm flex flex-col justify-between gap-2">
        <StatRow icon={<BookOpen className="h-3.5 w-3.5 text-[var(--ring-blue)]" />} label={t.home.stats.sentences} value={stats.sentences_completed} />
        <StatRow icon={<MessageSquare className="h-3.5 w-3.5 text-[var(--ring-green)]" />} label={t.home.stats.dialogs} value={stats.dialogs_completed} />
        <StatRow icon={<PenLine className="h-3.5 w-3.5 text-muted-foreground" />} label={t.home.stats.essays} value={stats.essays_completed} />
        <StatRow icon={<Video className="h-3.5 w-3.5 text-[var(--ring-orange)]" />} label={t.home.stats.videos} value={stats.videos_completed} />
      </div>

    </section>
  )
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}

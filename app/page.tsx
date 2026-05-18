'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, MessageSquare, PenLine, Video, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { WeekProgress } from '@/components/week-progress'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const router = useRouter()
  const { profile, activeLanguage, stats, weekActivity, isLoading, error } = useUser()

  // Если нет юзера — редирект на логин
  useEffect(() => {
    if (!isLoading && !profile) {
      router.push('/login')
    }
  }, [isLoading, profile, router])

  if (isLoading) return <HomeSkeletons />
  if (!profile) return null
  if (error) return <ErrorState message={error} />

  const lang = profile.interface_language
  const level = activeLanguage?.level ?? 'A1'
  const learningLang = activeLanguage?.learning_language ?? 'es'

  // Что сегодня делать (по дню недели)
  const todayIndex = new Date().getDay()
  const adjustedDay = todayIndex === 0 ? 6 : todayIndex - 1 // 0 = Mon
  const isDialogDay = [0, 1, 4, 5, 6].includes(adjustedDay) // Mon Tue Fri Sat Sun
  const isEssayDay = [2, 3].includes(adjustedDay) // Wed Thu

  const todayActivity = weekActivity.find(d => d.is_today)

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">

      {/* Language + Level card */}
      <section className="flex gap-3">
        <div className="flex-1 rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t('learningLanguage', lang)}</p>
          <p className="text-lg font-semibold">
            {learningLang === 'es' ? '🇪🇸' : '🇺🇸'} {t(learningLang === 'es' ? 'lang_es' : 'lang_en', lang)}
          </p>
        </div>
        <div className="flex-1 rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t('yourLevel', lang)}</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{level}</p>
            <Link
              href="/settings"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
            >
              {t('change', lang)} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-2">
        <StatCard
          icon={<BookOpen className="h-4 w-4 text-[var(--ring-blue)]" />}
          value={stats.sentences_completed}
          label={t('sentences_stat', lang)}
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4 text-[var(--ring-green)]" />}
          value={stats.dialogs_completed}
          label={t('dialogs_stat', lang)}
        />
        <StatCard
          icon={<PenLine className="h-4 w-4 text-muted-foreground" />}
          value={stats.essays_completed}
          label={t('essays_stat', lang)}
        />
        <StatCard
          icon={<Video className="h-4 w-4 text-[var(--ring-orange)]" />}
          value={stats.videos_completed}
          label={t('videos_stat', lang)}
        />
      </section>

      {/* Week rings */}
      <section className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          {t('weekProgress', lang)}
        </h2>
        <WeekProgress activity={weekActivity} lang={lang} />
      </section>

      {/* Today's task */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t('todayTask', lang)}</h2>

        <TodayCard
          href="/sentences"
          icon={<BookOpen className="h-5 w-5" />}
          label={t('sentences_stat', lang)}
          color="blue"
          done={todayActivity ? todayActivity.partially_complete : false}
          lang={lang}
        />

        {isDialogDay && (
          <TodayCard
            href="/practice"
            icon={<MessageSquare className="h-5 w-5" />}
            label={t('legend_dialog', lang)}
            color="green"
            done={todayActivity?.fully_complete ?? false}
            lang={lang}
          />
        )}

        {isEssayDay && (
          <TodayCard
            href="/practice"
            icon={<PenLine className="h-5 w-5" />}
            label={t('essays_stat', lang)}
            color="green"
            done={todayActivity?.fully_complete ?? false}
            lang={lang}
          />
        )}

        <TodayCard
          href="/video"
          icon={<Video className="h-5 w-5" />}
          label={t('videos_stat', lang)}
          color="orange"
          done={todayActivity ? (todayActivity.fully_complete) : false}
          lang={lang}
        />
      </section>

      {/* Start button */}
      <Button asChild className="w-full h-12 text-base font-medium">
        <Link href="/sentences">{t('startExercise', lang)}</Link>
      </Button>

    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
    </div>
  )
}

type ColorKey = 'blue' | 'green' | 'orange'

const colorMap: Record<ColorKey, string> = {
  blue: 'bg-[var(--ring-blue)]/10 text-[var(--ring-blue)]',
  green: 'bg-[var(--ring-green)]/10 text-[var(--ring-green)]',
  orange: 'bg-[var(--ring-orange)]/10 text-[var(--ring-orange)]',
}

function TodayCard({
  href,
  icon,
  label,
  color,
  done,
}: {
  href: string
  icon: React.ReactNode
  label: string
  color: ColorKey
  done: boolean
  lang: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]',
        done ? 'bg-muted opacity-60' : 'bg-card shadow-sm hover:shadow-md'
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0', colorMap[color])}>
        {icon}
      </div>
      <span className={cn('font-medium flex-1', done && 'line-through text-muted-foreground')}>
        {label}
      </span>
      {done ? (
        <span className="text-xs text-muted-foreground">✓</span>
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </Link>
  )
}

function HomeSkeletons() {
  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-20 rounded-2xl" />
        <Skeleton className="flex-1 h-20 rounded-2xl" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
      <Skeleton className="h-12 rounded-xl" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { WeekProgress } from '@/components/week-progress'
import { useT } from '@/hooks/use-t'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeTopSection } from '@/components/home-top-section'
import { ActivityArchive } from '@/components/activity-archive'

export default function Home() {
  const router = useRouter()
  const { user, profile, interfaceLang: lang, learningLang, level, stats, weekActivity, isLoading, error, refetch } = useUser()
  const { t } = useT()
  const [tip, setTip] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  // User data is shared across pages; refresh stats quietly when returning home
  useEffect(() => {
    if (!isLoading) refetch({ silent: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return
    fetch(`/api/tips?language=${learningLang}&level=${level}&interface_lang=${lang}`)
      .then(r => r.json())
      .then((d: { tip?: string | null }) => { if (d.tip) setTip(d.tip) })
      .catch(() => {})
  }, [user, lang, learningLang, level])

  if (isLoading) return <HomeSkeletons />
  if (!user) return null
  if (error) return <ErrorState message={error} />
  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted-foreground">{t.home.finishProfileSetup}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">

      <HomeTopSection
        learningLang={learningLang}
        level={level}
        stats={stats}
      />

      {/* Week rings */}
      <section className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t.home.weekActivity}
          </h2>
          <ActivityArchive userId={profile.id} />
        </div>
        <WeekProgress activity={weekActivity} />
      </section>

      {/* Tip of the day */}
      {tip && (
        <section className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-medium text-muted-foreground">{t.home.tipOfDay}</h2>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{tip}</p>
        </section>
      )}

      {/* Start button */}
      <Button asChild className="w-full h-12 text-base font-medium">
        <Link href="/sentences">{t.home.startExercise}</Link>
      </Button>

    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

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

'use client'

import { useState } from 'react'
import { Book, PenLine, Video } from 'lucide-react'
import { useApp } from '@/core'
import { TIPS_BY_LEVEL } from '@/core/constants'
import { StatCard } from '@/components/stat-card'
import { TaskCard } from '@/components/task-card'
import { TipCard } from '@/components/tip-card'
import { WeekProgress } from '@/components/week-progress'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { state, translate } = useApp()
  const { profile, stats } = state

  const [todayTasks, setTodayTasks] = useState({
    sentence: false,
    writing: false,
    video: false,
  })
  
  // Demo data - will be replaced with real data later
  const DAYS_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const weekProgress = DAYS_KEYS.map((dayKey, i) => ({
    day: translate(dayKey),
    sentence: i < 3 || (i === 3 && todayTasks.sentence),
    writing: i < 2 || (i === 3 && todayTasks.writing),
    video: i < 3 || (i === 3 && todayTasks.video),
  }))
  
  const currentDay = new Date().getDay()
  const adjustedDay = currentDay === 0 ? 6 : currentDay - 1 // Monday = 0
  
  // Tip based on level
  const tips = TIPS_BY_LEVEL[profile.level]
  const tipOfDay = tips[Math.floor(Date.now() / 86400000) % tips.length]

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard 
          icon={<Book className="h-5 w-5 text-ring-blue" />}
          value={stats.totalSentences}
          label={translate('totalSentences')}
        />
        <StatCard 
          icon={<PenLine className="h-5 w-5 text-ring-green" />}
          value={stats.totalWritings}
          label={translate('totalWritings')}
        />
        <StatCard 
          icon={<Video className="h-5 w-5 text-ring-orange" />}
          value={stats.totalVideos}
          label={translate('totalVideos')}
        />
      </section>
      
      {/* Week progress */}
      <section className="rounded-2xl bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">{translate('weekProgress')}</h2>
        <WeekProgress 
          days={weekProgress}
          currentDay={adjustedDay}
        />
      </section>
      
      {/* Today's tasks */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">{translate('todayTasks')}</h2>
        <div className="space-y-2">
          <TaskCard
            title={translate('sentenceOfDay')}
            description="i+1"
            completed={todayTasks.sentence}
            color="blue"
            href="/sentences"
            onOpen={() => setTodayTasks(prev => ({ ...prev, sentence: true }))}
          />
          <TaskCard
            title={translate('writeText')}
            description=""
            completed={todayTasks.writing}
            color="green"
            href="/writing"
            onOpen={() => setTodayTasks(prev => ({ ...prev, writing: true }))}
          />
          <TaskCard
            title={translate('videoOfDay')}
            description=""
            completed={todayTasks.video}
            color="orange"
            href="/video"
            onOpen={() => setTodayTasks(prev => ({ ...prev, video: true }))}
          />
        </div>
      </section>
      
      {/* Extra practice */}
      <section className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="text-xs">
          + {translate('sentenceOfDay')}
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          + {translate('writeText')}
        </Button>
        <Button variant="outline" size="sm" className="text-xs">
          + {translate('videoOfDay')}
        </Button>
      </section>
      
      {/* Tip of the day */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{translate('tipOfDay')}</h2>
        <TipCard tip={tipOfDay} />
      </section>
    </div>
  )
}

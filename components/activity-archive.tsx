'use client'

import { useState, useEffect } from 'react'
import { X, Archive, BookOpen, MessageSquare, PenLine, Video, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { InterfaceLang } from '@/types/database'

interface DayActivity {
  date: string
  sentences_done: number
  dialog_done: boolean
  essay_done: boolean
  video_done: boolean
  fully_complete: boolean
}

interface ActivityArchiveProps {
  lang: InterfaceLang
  userId: string
}

const DAY_LABELS: Record<InterfaceLang, string[]> = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  es: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
}

const MONTH_LABELS: Record<InterfaceLang, string[]> = {
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
}

export function ActivityArchive({ lang, userId }: ActivityArchiveProps) {
  const [open, setOpen] = useState(false)
  const [activity, setActivity] = useState<DayActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null)

  useEffect(() => {
    if (!open) return
    fetchActivity()
  }, [open])

  async function fetchActivity() {
    setLoading(true)
    const supabase = createClient()

    // Берём последние 90 дней
    const from = new Date()
    from.setDate(from.getDate() - 90)

    const { data } = await supabase
      .from('user_daily_activity')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from.toISOString().split('T')[0])
      .order('date', { ascending: false })

    setActivity(data ?? [])
    setLoading(false)
  }

  // Группируем по месяцам
  const grouped = groupByMonth(activity)

  return (
    <>
      {/* Кнопка архива */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Archive className="h-4 w-4" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => { setOpen(false); setSelectedDay(null) }}
        />
      )}

      {/* Main sheet */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-background shadow-2xl transition-transform duration-300 ease-out',
        open ? 'translate-y-0' : 'translate-y-full'
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold">
            {lang === 'ru' ? 'Архив активности' : lang === 'en' ? 'Activity Archive' : 'Archivo de actividad'}
          </h2>
          <button
            onClick={() => { setOpen(false); setSelectedDay(null) }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-6 pb-8">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="flex gap-1.5">
                {[0, 150, 300].map(d => (
                  <div key={d} className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}

          {!loading && activity.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {lang === 'ru' ? 'Пока нет данных' : lang === 'en' ? 'No data yet' : 'Sin datos aún'}
            </p>
          )}

          {!loading && grouped.map(({ month, year, days }) => (
            <div key={`${year}-${month}`}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {MONTH_LABELS[lang][month]} {year}
              </h3>

              {/* Day labels */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS[lang].map(d => (
                  <div key={d} className="text-center text-[10px] text-muted-foreground/60">{d}</div>
                ))}
              </div>

              {/* Weeks */}
              <div className="space-y-2">
                {days.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.map((day, di) => (
                      <div key={di} className="flex justify-center">
                        {day ? (
                          <button
                            onClick={() => setSelectedDay(day)}
                            className="flex flex-col items-center gap-0.5 group"
                          >
                            <MiniRing day={day} />
                            <span className="text-[9px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                              {new Date(day.date + 'T00:00:00').getDate()}
                            </span>
                          </button>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail sheet */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-[60] mx-auto max-w-lg rounded-t-3xl bg-background shadow-2xl transition-transform duration-300 ease-out',
        selectedDay ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <button
            onClick={() => setSelectedDay(null)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-semibold">
            {selectedDay ? formatDate(selectedDay.date, lang) : ''}
          </h2>
        </div>

        {selectedDay && (
          <div className="px-5 py-4 space-y-3 pb-10">
            <DayDetailRow
              icon={<BookOpen className="h-4 w-4 text-[var(--ring-blue)]" />}
              label={lang === 'ru' ? 'Предложения' : lang === 'en' ? 'Sentences' : 'Oraciones'}
              done={selectedDay.sentences_done > 0}
              detail={selectedDay.sentences_done > 0 ? `${selectedDay.sentences_done}` : undefined}
            />
            <DayDetailRow
              icon={<MessageSquare className="h-4 w-4 text-[var(--ring-green)]" />}
              label={lang === 'ru' ? 'Диалог' : lang === 'en' ? 'Dialog' : 'Diálogo'}
              done={selectedDay.dialog_done}
            />
            <DayDetailRow
              icon={<PenLine className="h-4 w-4 text-muted-foreground" />}
              label={lang === 'ru' ? 'Эссе' : lang === 'en' ? 'Essay' : 'Ensayo'}
              done={selectedDay.essay_done}
            />
            <DayDetailRow
              icon={<Video className="h-4 w-4 text-[var(--ring-orange)]" />}
              label={lang === 'ru' ? 'Видео' : lang === 'en' ? 'Video' : 'Video'}
              done={selectedDay.video_done}
            />
          </div>
        )}
      </div>
    </>
  )
}

// ─── Mini ring ───────────────────────────────

function MiniRing({ day }: { day: DayActivity }) {
  const size = 28
  const stroke = 3
  const center = size / 2
  const r1 = (size - stroke) / 2
  const r2 = r1 - stroke - 1.5
  const r3 = r2 - stroke - 1.5
  const c = (r: number) => 2 * Math.PI * r

  const hasAny = day.sentences_done > 0 || day.dialog_done || day.essay_done || day.video_done
  const ring1 = hasAny
  const ring2 = day.dialog_done || day.essay_done
  const ring3 = day.video_done

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={center} cy={center} r={r1} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      <circle cx={center} cy={center} r={r2} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      <circle cx={center} cy={center} r={r3} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      {ring1 && <circle cx={center} cy={center} r={r1} fill="none" stroke="var(--ring-blue)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c(r1)} strokeDashoffset={0} />}
      {ring2 && <circle cx={center} cy={center} r={r2} fill="none" stroke="var(--ring-green)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c(r2)} strokeDashoffset={0} />}
      {ring3 && <circle cx={center} cy={center} r={r3} fill="none" stroke="var(--ring-orange)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c(r3)} strokeDashoffset={0} />}
    </svg>
  )
}

// ─── Day detail row ───────────────────────────

function DayDetailRow({ icon, label, done, detail }: {
  icon: React.ReactNode
  label: string
  done: boolean
  detail?: string
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-2xl p-3.5',
      done ? 'bg-card' : 'bg-muted/40 opacity-50'
    )}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background">
        {icon}
      </div>
      <span className={cn('flex-1 text-sm font-medium', !done && 'text-muted-foreground')}>
        {label}
      </span>
      {done ? (
        <div className="flex items-center gap-1.5">
          {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
          <span className="text-sm text-[var(--ring-green)]">✓</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────

function groupByMonth(activity: DayActivity[]) {
  if (!activity.length) return []

  const map = new Map<string, DayActivity[]>()
  activity.forEach(a => {
    const key = a.date.slice(0, 7) // YYYY-MM
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  })

  return Array.from(map.entries()).map(([key, days]) => {
    const [year, month] = key.split('-').map(Number)

    // Строим сетку месяца (пн-вс)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    // Начало с понедельника
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const totalDays = lastDay.getDate()
    const cells: (DayActivity | null)[] = Array(startOffset).fill(null)

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const found = days.find(a => a.date === dateStr) ?? null
      // Показываем даже пустые дни если они в прошлом
      if (!found) {
        const date = new Date(dateStr)
        const today = new Date()
        today.setHours(0,0,0,0)
        cells.push(date <= today ? { date: dateStr, sentences_done: 0, dialog_done: false, essay_done: false, video_done: false, fully_complete: false } : null)
      } else {
        cells.push(found)
      }
    }

    // Разбиваем на недели
    const weeks: (DayActivity | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7)
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }

    return { month: month - 1, year, days: weeks }
  })
}

function formatDate(dateStr: string, lang: InterfaceLang): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate()
  const month = MONTH_LABELS[lang][date.getMonth()]
  const weekDay = DAY_LABELS[lang][(date.getDay() + 6) % 7]
  return `${weekDay}, ${day} ${month}`
}

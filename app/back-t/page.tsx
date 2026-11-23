'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, Volume2, Moon, Check } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { cn } from '@/lib/utils'
import { dayHeading, getTimeZone, parseLocalDate } from '@/lib/format'
import { getInterfaceLanguage, getLearningLanguage } from '@/lib/languages'
import { speak } from '@/lib/speech'
import { GlossSentence } from '@/components/gloss-sentence'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { BackTDone, BackTDue, BackTState, BackTToday } from '@/types/back-translation'

const HOW_SEEN_KEY = 'backt-how-seen'

export default function BackTPage() {
  const router = useRouter()
  const { user, interfaceLang, learningLang, level, isLoading: userLoading, refetch: refetchUser } = useUser()
  const { t } = useT()

  const [state, setState] = useState<BackTState | null>(null)
  const [count, setCount] = useState<number | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) router.push('/login')
  }, [userLoading, user, router])

  const load = useCallback(async () => {
    setLoadError(false)
    const params = new URLSearchParams({
      language: learningLang,
      interface_lang: interfaceLang,
      tz: getTimeZone(),
    })
    if (count) params.set('count', String(count))
    try {
      const res = await fetch(`/api/back-translation?${params}`)
      if (!res.ok) throw new Error(String(res.status))
      setState(await res.json() as BackTState)
    } catch {
      setLoadError(true)
    }
  }, [learningLang, interfaceLang, count])

  useEffect(() => {
    if (!userLoading && user) load()
  }, [userLoading, user, load])

  if (userLoading || (!state && !loadError)) return <BackTSkeleton />

  if (!state) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <p className="text-sm text-muted-foreground">{t.backT.errors.generic}</p>
        <Button onClick={load}>{t.common.tryAgain}</Button>
      </div>
    )
  }

  const onForwardSaved = (sentenceId: string, saved: { id: string; forward_text: string }) => {
    setState(s => s && {
      ...s,
      today: s.today.map(item => item.sentence.id === sentenceId ? { ...item, ...saved } : item),
    })
    refetchUser({ silent: true })
  }

  const onBackDone = (result: BackTDone) => {
    setState(s => s && {
      ...s,
      due: s.due.filter(d => d.id !== result.id),
      done: [result, ...s.done],
    })
    refetchUser({ silent: true })
  }

  const savedToday = state.today.filter(i => i.id).length
  const canAddMore = state.today.length < state.max && !state.noMoreSentences
  const allDone = state.due.length === 0 && state.today.length > 0 && savedToday === state.today.length

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.backT.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {getLearningLanguage(learningLang).flag} {level} · {t.backT.subtitle}
        </p>
      </div>

      <HowItWorks />

      {/* Step 2: translate back (the original stays hidden) */}
      {state.due.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t.backT.dueTitle}</SectionTitle>
          <p className="text-xs text-muted-foreground -mt-1">{t.backT.dueHint}</p>
          {state.due.map(item => (
            <DueCard key={item.id} item={item} onDone={onBackDone} />
          ))}
        </section>
      )}

      {/* Step 1: today's new sentences */}
      <section className="space-y-3">
        <SectionTitle>{t.backT.todayTitle}</SectionTitle>
        {state.today.map(item => (
          <TodayCard
            key={item.sentence.id}
            item={item}
            glossLocale={getInterfaceLanguage(interfaceLang).locale}
            onSaved={saved => onForwardSaved(item.sentence.id, saved)}
          />
        ))}

        {state.noMoreSentences && (
          <div className="rounded-2xl border border-dashed border-border p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t.backT.noMoreSentences}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/sentences">{t.backT.goToSentences}</Link>
            </Button>
          </div>
        )}

        {canAddMore ? (
          <button
            onClick={() => setCount(state.today.length + 1)}
            className="w-full rounded-2xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-[0.98]"
          >
            {t.backT.addMore}
          </button>
        ) : state.today.length >= state.max && (
          <p className="text-center text-xs text-muted-foreground">{t.backT.maxReached(state.max)}</p>
        )}
      </section>

      {allDone && (
        <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center text-sm font-medium text-green-700 dark:text-green-400">
          {t.backT.allDone}
        </div>
      )}

      {/* Today's results */}
      {state.done.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t.backT.doneTitle}</SectionTitle>
          {state.done.map(item => <ResultCard key={item.id} item={item} />)}
        </section>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────
// How it works (open until the user closes it once)
// ─────────────────────────────────────────────

function HowItWorks() {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(HOW_SEEN_KEY) !== '1')
    } catch { /* storage unavailable: keep closed */ }
  }, [])

  const toggle = () => {
    setOpen(o => {
      try { if (o) localStorage.setItem(HOW_SEEN_KEY, '1') } catch { /* ignore */ }
      return !o
    })
  }

  return (
    <section className="rounded-2xl bg-card shadow-sm">
      <button onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
        {t.backT.howTitle}
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ol className="space-y-2 px-4 pb-4">
          {t.backT.how.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-foreground/80">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────
// Step 1 card
// ─────────────────────────────────────────────

function TodayCard({
  item,
  glossLocale,
  onSaved,
}: {
  item: BackTToday
  glossLocale: string
  onSaved: (saved: { id: string; forward_text: string }) => void
}) {
  const { t } = useT()
  const { learningLang, interfaceLang } = useUser()
  const [showGloss, setShowGloss] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const learningLocale = getLearningLanguage(learningLang).ttsLocale

  const save = async () => {
    if (!text.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/back-translation/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence_id: item.sentence.id,
          text,
          language: learningLang,
          interface_language: interfaceLang,
          tz: getTimeZone(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(errorText(t.backT.errors, data.code))
      onSaved({ id: data.id, forward_text: data.forward_text })
    } catch (err) {
      setError(err instanceof Error ? err.message : t.backT.errors.generic)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
      <GlossSentence chunks={item.sentence.chunks} showGloss={showGloss} lang={learningLocale} glossLang={glossLocale} />

      <div className="flex items-center gap-4">
        <button
          onClick={() => speak(item.sentence.sentence_text, learningLang)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {t.common.listen}
        </button>
        <button
          onClick={() => setShowGloss(s => !s)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {showGloss ? t.backT.hideHints : t.backT.showHints}
        </button>
      </div>

      {item.forward_text ? (
        <div className="rounded-xl bg-muted/50 px-3.5 py-3 space-y-1.5">
          <Label>{t.backT.yourTranslation}</Label>
          <p className="text-sm">{item.forward_text}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Moon className="h-3.5 w-3.5" />
            {t.backT.savedTomorrow}
          </p>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t.backT.forwardPlaceholder}
            rows={2}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-destructive">{error}</p>
            <Button onClick={save} disabled={!text.trim() || saving} size="sm">
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {t.backT.save}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2 card
// ─────────────────────────────────────────────

function DueCard({ item, onDone }: { item: BackTDue; onDone: (result: BackTDone) => void }) {
  const { t, locale } = useT()
  const { learningLang, level } = useUser()
  const [text, setText] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const check = async () => {
    if (!text.trim()) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/back-translation/back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, text, level, tz: getTimeZone() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(errorText(t.backT.errors, data.code))
      onDone(data as BackTDone)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.backT.errors.generic)
      setChecking(false)
    }
  }

  return (
    <div className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
      <div className="space-y-1">
        <Label>{t.backT.fromDate(dayHeading(locale, parseLocalDate(item.forward_date)))}</Label>
        <p className="text-base font-medium leading-snug">{item.forward_text}</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.backT.backPlaceholder}
        lang={getLearningLanguage(learningLang).ttsLocale}
        rows={2}
        maxLength={1000}
        disabled={checking}
        className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-destructive">{checking ? '' : error}</p>
        <Button onClick={check} disabled={!text.trim() || checking} size="sm">
          {checking && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {checking ? t.backT.checking : t.backT.check}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Result card
// ─────────────────────────────────────────────

function ResultCard({ item }: { item: BackTDone }) {
  const { t, lang } = useT()
  const { learningLang } = useUser()
  const { feedback } = item

  const tone = {
    exact: 'bg-green-500/10 text-green-700 dark:text-green-400',
    close: 'bg-primary/10 text-primary',
    different: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  }[feedback.verdict]

  return (
    <div className="rounded-2xl bg-card shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold', tone)}>
          {feedback.verdict === 'exact' && <Check className="mr-1 inline h-3.5 w-3.5" />}
          {t.backT.verdict[feedback.verdict]}
        </span>
        <span className="text-sm font-bold text-primary">{feedback.score}<span className="text-muted-foreground font-medium">/10</span></span>
      </div>

      <div className="space-y-1.5">
        <Label>{t.backT.original}</Label>
        <GlossSentence
          chunks={item.sentence.chunks}
          lang={getLearningLanguage(learningLang).ttsLocale}
          glossLang={getInterfaceLanguage(lang).locale}
        />
        <button
          onClick={() => speak(item.sentence.sentence_text, learningLang)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {t.common.listen}
        </button>
      </div>

      <div className="grid gap-3 rounded-xl bg-muted/50 px-3.5 py-3">
        <div className="space-y-0.5">
          <Label>{t.backT.yourVersion}</Label>
          <p className="text-sm font-medium">{item.back_text}</p>
        </div>
        <div className="space-y-0.5">
          <Label>{t.backT.yourTranslation}</Label>
          <p className="text-sm text-muted-foreground">{item.forward_text}</p>
        </div>
      </div>

      {feedback.praise && <p className="text-sm leading-relaxed text-foreground/80">{feedback.praise}</p>}

      {feedback.corrections.length > 0 && (
        <div className="space-y-2.5">
          <Label>{t.backT.corrections}</Label>
          {feedback.corrections.map((c, i) => (
            <div key={i} className="space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground line-through">{c.yours}</span>
                {' → '}
                <span className="font-medium text-green-700 dark:text-green-300">{c.better}</span>
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.why}</p>
            </div>
          ))}
        </div>
      )}

      {feedback.tips.length > 0 && (
        <div className="space-y-1.5">
          <Label>{t.backT.tips}</Label>
          {feedback.tips.map((tip, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/80">💡 {tip}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Small pieces
// ─────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/60">{children}</p>
  )
}

function errorText(errors: Record<string, string>, code?: string): string {
  return (code && errors[code]) || errors.generic
}

function BackTSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <Skeleton className="h-7 w-32 rounded-lg" />
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}

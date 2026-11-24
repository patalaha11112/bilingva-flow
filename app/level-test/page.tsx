'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, ChevronRight, Loader2, Sparkles, Target, Volume2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { speak } from '@/lib/speech'
import { LEARNING_LANG_CODES } from '@/lib/languages'
import { Button } from '@/components/ui/button'
import { LevelList } from '@/components/level-list'
import type { LearningLang, Level } from '@/types/database'
import type { PlacementResult, PlacementTest } from '@/types/placement'

type Phase = 'intro' | 'loading' | 'understand' | 'translate' | 'essay' | 'analyzing' | 'result' | 'error'

/** Two sentences in a row understood less than this end step 1 early */
const LOW_UNDERSTANDING = 0.34

export default function LevelTestPage() {
  return (
    <Suspense fallback={null}>
      <LevelTest />
    </Suspense>
  )
}

function LevelTest() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, isLoading, interfaceLang, learningLang, level: currentLevel, activeLanguage, setActiveLanguage, updateLevel, refetch } = useUser()
  const { t } = useT()
  const ui = t.levelTest

  const fromWelcome = params.get('from') === 'welcome'
  const paramLang = params.get('language') as LearningLang | null
  const language: LearningLang = paramLang && LEARNING_LANG_CODES.includes(paramLang) ? paramLang : learningLang

  const [phase, setPhase] = useState<Phase>('intro')
  const [errorText, setErrorText] = useState('')
  const [test, setTest] = useState<PlacementTest | null>(null)

  // Step 1: understood chunk indexes per sentence
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [understood, setUnderstood] = useState<{ id: string; understood: number; total: number }[]>([])
  // Step 2: null = "I don't know"
  const [translations, setTranslations] = useState<Record<string, string | null>>({})
  // Step 3
  const [essay, setEssay] = useState('')

  const [result, setResult] = useState<PlacementResult | null>(null)
  const [choosing, setChoosing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [isLoading, user, router])

  const exit = () => router.push(fromWelcome ? '/welcome' : '/settings')

  const start = async () => {
    setPhase('loading')
    try {
      const res = await fetch(`/api/placement?language=${language}&interface_lang=${interfaceLang}`)
      if (!res.ok) throw new Error('unavailable')
      const data = await res.json() as PlacementTest
      setTest(data)
      setIndex(0)
      setSelected(new Set())
      setUnderstood([])
      setTranslations({})
      setPhase('understand')
    } catch {
      setErrorText(ui.errors.unavailable)
      setPhase('error')
    }
  }

  const answerUnderstand = (count: number) => {
    if (!test) return
    const item = test.understand[index]
    const answers = [...understood, { id: item.id, understood: count, total: item.parts.length }]
    setUnderstood(answers)
    setSelected(new Set())

    const ratio = (a: { understood: number; total: number }) => a.understood / a.total
    const lastTwoLow = answers.length >= 2 && answers.slice(-2).every((a) => ratio(a) < LOW_UNDERSTANDING)
    if (lastTwoLow || index === test.understand.length - 1) setPhase('translate')
    else setIndex(index + 1)
  }

  const submit = async (withEssay: boolean) => {
    if (!test) return
    setPhase('analyzing')
    try {
      const res = await fetch('/api/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          interface_language: interfaceLang,
          understand: understood,
          translations: test.translate.map((item) => ({ id: item.id, text: translations[item.id]?.trim() || null })),
          essay: withEssay ? essay.trim() || null : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { code?: string }
        const errors = ui.errors as Record<string, string>
        throw new Error((err.code && errors[err.code]) || ui.errors.generic)
      }
      setResult(await res.json() as PlacementResult)
      setPhase('result')
      // The test may have filled in "about me"
      refetch({ silent: true })
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : ui.errors.generic)
      setPhase('essay')
    }
  }

  const applyLevel = async (level: Level) => {
    setSaving(true)
    if (activeLanguage?.learning_language !== language) await setActiveLanguage(language)
    await updateLevel(language, level)
    router.replace(fromWelcome ? '/' : '/settings')
  }

  if (isLoading || !user) return null

  // ── Intro ──────────────────────────────────
  if (phase === 'intro' || phase === 'error') {
    return (
      <Screen onBack={exit} backLabel={ui.exit}>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{ui.introTitle}</h1>
        </div>
        <ol className="space-y-3">
          {ui.intro.map((line, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-card p-4 shadow-sm">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span className="text-sm leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm leading-relaxed text-muted-foreground">{ui.introNote}</p>
        {phase === 'error' && <p className="text-sm text-destructive">{errorText}</p>}
        <Button className="h-12 w-full text-base" onClick={start}>
          {phase === 'error' ? t.common.tryAgain : ui.start}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Screen>
    )
  }

  if (phase === 'loading' || phase === 'analyzing') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="font-medium">{phase === 'loading' ? ui.preparing : ui.analyzing}</p>
          <p className="text-sm text-muted-foreground">{phase === 'loading' ? ui.preparingHint : ui.analyzingHint}</p>
        </div>
      </div>
    )
  }

  if (!test) return null

  // ── Step 1: understanding ─────────────────
  if (phase === 'understand') {
    const item = test.understand[index]
    return (
      <Screen onBack={exit} backLabel={ui.exit} step={1} progress={(index + 1) / test.understand.length}>
        <StepTitle step={ui.step(1)} title={ui.understandTitle} hint={ui.understandHint} />
        <div className="space-y-4 rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-semibold leading-snug tracking-tight">{item.sentence_text}</p>
            <button
              onClick={() => speak(item.sentence_text, language)}
              aria-label={t.common.listen}
              className="mt-1 text-muted-foreground transition-colors hover:text-primary"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.parts.map((part, i) => {
              const on = selected.has(i)
              return (
                <button
                  key={i}
                  onClick={() => setSelected((s) => {
                    const next = new Set(s)
                    if (next.has(i)) next.delete(i)
                    else next.add(i)
                    return next
                  })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97]',
                    on ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400' : 'border-border bg-background'
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {part}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => answerUnderstand(0)}>
            <X className="mr-1 h-4 w-4" /> {ui.understandNone}
          </Button>
          <Button variant="outline" onClick={() => answerUnderstand(item.parts.length)}>
            <Check className="mr-1 h-4 w-4" /> {ui.understandAll}
          </Button>
        </div>
        <Button className="h-12 w-full text-base" disabled={selected.size === 0} onClick={() => answerUnderstand(selected.size)}>
          {ui.next} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Screen>
    )
  }

  // ── Step 2: translation ───────────────────
  if (phase === 'translate') {
    const allAnswered = test.translate.every((item) => item.id in translations)
    return (
      <Screen onBack={exit} backLabel={ui.exit} step={2}>
        <StepTitle step={ui.step(2)} title={ui.translateTitle} hint={ui.translateHint} />
        {test.translate.map((item) => {
          const value = translations[item.id]
          const dontKnow = item.id in translations && value === null
          return (
            <div key={item.id} className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold leading-snug">{item.sentence_text}</p>
                <button
                  onClick={() => speak(item.sentence_text, language)}
                  aria-label={t.common.listen}
                  className="mt-0.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
              {dontKnow ? (
                <button
                  onClick={() => setTranslations(({ [item.id]: _, ...rest }) => rest)}
                  className="w-full rounded-xl bg-muted px-3 py-2.5 text-left text-sm text-muted-foreground"
                >
                  {ui.dontKnow} ✓
                </button>
              ) : (
                <>
                  <textarea
                    value={value ?? ''}
                    onChange={(e) => setTranslations((s) => {
                      const next = { ...s }
                      if (e.target.value.trim()) next[item.id] = e.target.value
                      else delete next[item.id]
                      return next
                    })}
                    placeholder={ui.translatePlaceholder}
                    rows={2}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  {!value && (
                    <button
                      onClick={() => setTranslations((s) => ({ ...s, [item.id]: null }))}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {ui.dontKnow}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
        <Button className="h-12 w-full text-base" disabled={!allAnswered} onClick={() => setPhase('essay')}>
          {ui.next} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Screen>
    )
  }

  // ── Step 3: essay about yourself ──────────
  if (phase === 'essay') {
    const words = essay.trim() ? essay.trim().split(/\s+/).length : 0
    return (
      <Screen onBack={exit} backLabel={ui.exit} step={3}>
        <StepTitle step={ui.step(3)} title={ui.essayTitle} hint={ui.essayHint} />
        <ul className="flex flex-wrap gap-1.5">
          {ui.essayQuestions.map((q, i) => (
            <li key={i} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">{q}</li>
          ))}
        </ul>
        <div className="space-y-1.5">
          <textarea
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder={ui.essayPlaceholder}
            rows={8}
            maxLength={5000}
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed shadow-sm outline-none focus:border-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{ui.essayGoal}</span>
            <span className="tabular-nums">{ui.words(words)}</span>
          </div>
        </div>
        {errorText && <p className="text-sm text-destructive">{errorText}</p>}
        <Button className="h-12 w-full text-base" disabled={words === 0} onClick={() => { setErrorText(''); submit(true) }}>
          {ui.finish} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => { setErrorText(''); submit(false) }}>
          {ui.cantWrite}
        </Button>
      </Screen>
    )
  }

  // ── Result ────────────────────────────────
  if (!result) return null
  const sameLevel = !fromWelcome && result.level === currentLevel && activeLanguage?.learning_language === language

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <section className="space-y-3 rounded-2xl bg-card p-5 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{ui.resultTitle}</p>
        <p className="text-5xl font-black tracking-tight text-primary">{result.level}</p>
        <p className="text-sm font-medium">{t.levels[result.level]}</p>
        <p className="text-sm leading-relaxed text-foreground/80">{result.comment}</p>
        {result.confidence === 'low' && <p className="text-xs text-muted-foreground">{ui.lowConfidence}</p>}
      </section>

      {result.strengths.length > 0 && (
        <section className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <Label>{ui.strengths}</Label>
          {result.strengths.map((s, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-sm font-medium">✨ {s.title}</p>
              <p className="text-xs italic text-muted-foreground">{s.example}</p>
            </div>
          ))}
        </section>
      )}

      {result.focus_areas.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-sm">
          <Label>{ui.focus}</Label>
          {result.focus_areas.map((f, i) => (
            <div key={i} className="space-y-0.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Target className="h-3.5 w-3.5" /> {f.title}
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">{f.why}</p>
              <p className="text-xs italic text-muted-foreground">{f.example}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{ui.focusHint}</p>
        </section>
      )}

      {result.about_me && (
        <section className="space-y-2 rounded-2xl bg-card p-4 shadow-sm">
          <Label>{ui.aboutMe}</Label>
          <p className="text-sm leading-relaxed text-foreground/80">{result.about_me}</p>
          <p className="text-xs text-muted-foreground">{ui.aboutMeHint}</p>
        </section>
      )}

      {choosing ? (
        <LevelList onChoose={applyLevel} disabled={saving} current={result.level} />
      ) : sameLevel ? (
        <Button className="h-12 w-full text-base" onClick={() => router.replace('/settings')}>
          {ui.done}
        </Button>
      ) : (
        <div className="space-y-2">
          <Button className="h-12 w-full text-base" disabled={saving} onClick={() => applyLevel(result.level)}>
            <Sparkles className="mr-1.5 h-4 w-4" /> {ui.startWith(result.level)}
          </Button>
          <Button variant="outline" className="w-full" disabled={saving} onClick={() => setChoosing(true)}>
            {ui.chooseOther}
          </Button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Layout pieces
// ─────────────────────────────────────────────

function Screen({ onBack, backLabel, step, progress, children }: {
  onBack: () => void
  backLabel: string
  step?: number
  /** Progress inside the step, 0–1 */
  progress?: number
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label={backLabel}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {step && (
          <div className="flex flex-1 gap-1.5">
            {[1, 2, 3].map((s) => (
              <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: s < step ? '100%' : s === step ? `${Math.max(progress ?? 1, 0.1) * 100}%` : '0%' }}
                />
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function StepTitle({ step, title, hint }: { step: string; title: string; hint: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{step}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/60">{children}</p>
}

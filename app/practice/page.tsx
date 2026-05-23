'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Star } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'

type Phase = 'loading' | 'writing' | 'analyzing' | 'feedback' | 'done_today'

interface SuggestedWord {
  text: string
  translation: string
}

interface FeedbackData {
  score: number
  feedback: string
  word_count: number
}

export default function PracticePage() {
  const { profile, activeLanguage, isLoading: userLoading } = useUser()

  const lang: InterfaceLang = profile?.interface_language ?? 'ru'
  const learningLang: LearningLang = activeLanguage?.learning_language ?? 'es'
  const level: Level = activeLanguage?.level ?? 'A1'

  const [phase, setPhase] = useState<Phase>('loading')
  const [topic, setTopic] = useState('')
  const [suggestedWords, setSuggestedWords] = useState<SuggestedWord[]>([])
  const [content, setContent] = useState('')
  const [isBonus, setIsBonus] = useState(false)
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  const [submitError, setSubmitError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0

  useEffect(() => {
    if (userLoading) return
    fetchTopic()
  }, [userLoading, learningLang]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTopic = async () => {
    setPhase('loading')
    try {
      const res = await fetch(
        `/api/practice/topic?language=${learningLang}&interface_lang=${lang}`
      )
      if (!res.ok) throw new Error('Failed')
      const data = await res.json() as {
        topic: string
        suggested_words: SuggestedWord[]
        essay_done_today: boolean
      }
      setTopic(data.topic)
      setSuggestedWords(data.suggested_words ?? [])
      setPhase(data.essay_done_today ? 'done_today' : 'writing')
    } catch {
      setPhase('writing')
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitError('')
    setPhase('analyzing')

    try {
      const res = await fetch('/api/practice/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          topic,
          language: learningLang,
          level,
          interface_language: lang,
          is_bonus: isBonus,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Server error')
      }
      const data = await res.json() as { score: number; feedback: string; word_count: number }
      setFeedbackData({ score: data.score, feedback: data.feedback, word_count: data.word_count })
      setPhase('feedback')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error')
      setPhase('writing')
    }
  }

  const handleWriteAnother = async () => {
    setContent('')
    setFeedbackData(null)
    setIsBonus(true)
    try {
      const res = await fetch(
        `/api/practice/topic?language=${learningLang}&interface_lang=${lang}`
      )
      if (res.ok) {
        const data = await res.json() as { topic: string; suggested_words: SuggestedWord[] }
        setTopic(data.topic)
        setSuggestedWords(data.suggested_words ?? [])
      }
    } catch { /* keep current topic */ }
    setPhase('writing')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  if (phase === 'loading' || userLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <div className="h-28 rounded-2xl bg-muted animate-pulse" />
        <div className="h-16 rounded-2xl bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (phase === 'done_today') {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        <CompletionCard lang={lang} topic={topic} />
        <button
          onClick={handleWriteAnother}
          className="w-full rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/15 active:scale-[0.98]"
        >
          {t('essayWriteAnother', lang)}
        </button>
      </div>
    )
  }

  if (phase === 'analyzing') {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="rounded-2xl bg-card shadow-sm p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{t('essayAnalyzing', lang)}</p>
        </div>
      </div>
    )
  }

  if (phase === 'feedback' && feedbackData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">

        {/* Score card */}
        <section className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">{t('essayGreatWork', lang)}</p>
            <span className="text-xs text-muted-foreground">
              {feedbackData.word_count} {t('essayWordCountSuffix', lang)}
            </span>
          </div>
          <ScoreDisplay score={feedbackData.score} label={t('essayScoreLabel', lang)} />
        </section>

        {/* AI feedback */}
        <section className="rounded-2xl bg-card shadow-sm p-5 space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/50">
            {t('essayFeedbackLabel', lang)}
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{feedbackData.feedback}</p>
        </section>

        <button
          onClick={handleWriteAnother}
          className="w-full rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/15 active:scale-[0.98]"
        >
          {t('essayWriteAnother', lang)}
        </button>

      </div>
    )
  }

  // Writing phase
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">

      {/* Topic */}
      <section className="rounded-2xl bg-card shadow-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/50">
            {t('essayTopic', lang)}
          </p>
          {isBonus && (
            <span className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-widest text-primary">
              {t('essayBonusLabel', lang)}
            </span>
          )}
        </div>
        <p className="text-lg font-semibold leading-snug">{topic}</p>
      </section>

      {/* Suggested words */}
      {suggestedWords.length > 0 && (
        <section className="rounded-2xl bg-card shadow-sm p-4 space-y-2.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/50">
            {t('essaySuggestedWords', lang)}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedWords.map(word => (
              <WordChip key={word.text} word={word} />
            ))}
          </div>
        </section>
      )}

      {/* Textarea + submit */}
      <section className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('essayPlaceholder', lang)}
          rows={8}
          className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/60">
            {wordCount > 0
              ? `${wordCount} ${t('essayWordCountSuffix', lang)}`
              : t('essayMinHint', lang)}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.97]',
              content.trim()
                ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {t('essaySubmit', lang)}
          </button>
        </div>
        {submitError && (
          <p className="text-xs text-destructive">{submitError}</p>
        )}
      </section>

    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function CompletionCard({ lang, topic }: { lang: InterfaceLang; topic: string }) {
  const messages: Record<InterfaceLang, string> = {
    ru: 'Ты уже написал эссе сегодня 🎉',
    en: 'You already wrote an essay today 🎉',
    es: 'Ya escribiste un ensayo hoy 🎉',
  }
  return (
    <section className="rounded-2xl bg-card shadow-sm p-5 space-y-2 text-center">
      <p className="text-base font-semibold">{messages[lang]}</p>
      <p className="text-sm text-muted-foreground">{topic}</p>
    </section>
  )
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-primary">{score}</span>
        <span className="text-lg font-semibold text-muted-foreground">/10</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3.5 w-3.5',
              i < score ? 'fill-primary text-primary' : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
    </div>
  )
}

function WordChip({ word }: { word: SuggestedWord }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5">
      <span className="text-xs font-semibold text-foreground">{word.text}</span>
      <span className="text-xs text-muted-foreground/70">— {word.translation}</span>
    </div>
  )
}

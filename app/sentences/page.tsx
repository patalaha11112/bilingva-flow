'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Volume2, ChevronRight, Check, Plus, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useSentences } from '@/hooks/use-sentences'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { getLearningLanguage, type LearningLang } from '@/lib/languages'
import { speak } from '@/lib/speech'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SentenceWithParts, SentencePart, InterfaceLang, Level } from '@/types/database'

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function SentencesPage() {
  const router = useRouter()
  const { user, interfaceLang: lang, learningLang: language, level, isLoading: userLoading } = useUser()
  const [mode, setMode] = useState<'list' | 'train'>('list')
  const [trainIndex, setTrainIndex] = useState(0)

  useEffect(() => {
    if (!userLoading && !user) router.push('/login')
  }, [userLoading, user, router])


  const {
    sentences,
    userProgress,
    isLoading,
    isGenerating,
    error,
    weeklyCount,
    weeklyLimit,
    limitReached,
    markPartUnderstood,
    markAllUnderstood,
    nextSentence,
    addMoreSentences,
    refreshSentences,
    refetch,
  } = useSentences({
    language,
    level,
    interfaceLanguage: lang,
    enabled: !userLoading && !!user,
  })

  if (userLoading || isLoading) return <SentencesSkeleton />

  if (error) return <ErrorState message={error} onRetry={refetch} lang={lang} />

  if (isGenerating) return <GeneratingState lang={lang} level={level} />

  if (mode === 'train') {
    return (
      <TrainView
        sentences={sentences}
        currentIndex={trainIndex}
        userProgress={userProgress}
        lang={lang}
        level={level}
        onMarkPart={markPartUnderstood}
        onMarkAll={markAllUnderstood}
        onNext={() => {
          if (trainIndex < sentences.length - 1) {
            setTrainIndex(prev => prev + 1)
          } else {
            setMode('list')
            setTrainIndex(0)
          }
        }}
        onBack={() => {
          setMode('list')
          setTrainIndex(0)
        }}
      />
    )
  }

  return (
    <ListView
      sentences={sentences}
      userProgress={userProgress}
      lang={lang}
      level={level}
      language={language}
      isGenerating={isGenerating}
      weeklyCount={weeklyCount}
      weeklyLimit={weeklyLimit}
      limitReached={limitReached}
      onStartTrain={() => {
        setTrainIndex(0)
        setMode('train')
      }}
      onAddMore={addMoreSentences}
      onRefresh={refreshSentences}
    />
  )
}

// ─────────────────────────────────────────────
// LIST VIEW — список предложений недели
// ─────────────────────────────────────────────

const UI: Record<string, Record<string, string>> = {
  ru: {
    title: 'Предложения недели',
    train: 'Тренироваться',
    addMore: '+ Добавить ещё одно',
    noSentences: 'Нет предложений',
    understood: 'Понял',
    hint: 'Прочитай каждую часть. Отметь те которые ты понимаешь без перевода — даже если ещё не используешь в речи. Это уже пассивная память — и это отличный старт!',
    allUnderstood: 'Всё понятно',
    next: 'Следующее предложение',
    back: 'Назад',
    generating: 'Генерируем предложения для тебя...',
    generatingHint: 'Это займёт несколько секунд',
    progress: 'Прогресс',
    done: 'Готово',
  },
  en: {
    title: 'Weekly Sentences',
    train: 'Start Training',
    addMore: '+ Add one more',
    noSentences: 'No sentences',
    understood: 'Got it',
    hint: 'Read each part. Mark the ones you understand without translation — even if you don\'t use them yet. That\'s already passive memory — a great start!',
    allUnderstood: 'All clear',
    next: 'Next sentence',
    back: 'Back',
    generating: 'Generating sentences for you...',
    generatingHint: 'This will take a few seconds',
    progress: 'Progress',
    done: 'Done',
  },
  es: {
    title: 'Oraciones de la semana',
    train: 'Entrenar',
    addMore: '+ Añadir una más',
    noSentences: 'Sin oraciones',
    understood: 'Entendido',
    hint: 'Lee cada parte. Marca las que entiendes sin traducción — aunque aún no las uses. Eso ya es memoria pasiva — ¡un gran comienzo!',
    allUnderstood: 'Todo claro',
    next: 'Siguiente oración',
    back: 'Atrás',
    generating: 'Generando oraciones para ti...',
    generatingHint: 'Esto tomará unos segundos',
    progress: 'Progreso',
    done: 'Listo',
  },
}

function ListView({
  sentences,
  userProgress,
  lang,
  level,
  language,
  isGenerating,
  weeklyCount,
  weeklyLimit,
  limitReached,
  onStartTrain,
  onAddMore,
  onRefresh,
}: {
  sentences: SentenceWithParts[]
  userProgress: Record<string, any>
  lang: InterfaceLang
  level: Level
  language: LearningLang
  isGenerating: boolean
  weeklyCount: number
  weeklyLimit: number
  limitReached: boolean
  onStartTrain: () => void
  onAddMore: () => void
  onRefresh: () => void
}) {
  const ui = UI[lang] ?? UI.ru
  const MAX_SENTENCES = 10
  const canAddMore = weeklyCount < weeklyLimit && !limitReached

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{ui.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getLearningLanguage(language).flag} {level}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isGenerating || limitReached}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={lang === 'ru' ? 'Обновить предложения' : lang === 'es' ? 'Actualizar sugerencias' : 'Refresh suggestions'}
          >
            <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
          </button>
          <div className="text-sm font-medium text-muted-foreground">
            {sentences.length}/{weeklyLimit}
          </div>
        </div>
      </div>

      {/* Sentence list */}
      <div className="space-y-2">
        {sentences.map((sentence, i) => {
          const progress = userProgress[sentence.id]
          const understood = progress?.understood_parts?.length ?? 0
          const total = sentence.sentence_parts?.length ?? 0
          const isDone = progress?.all_understood

          return (
            <div
              key={sentence.id}
              className={cn(
                'rounded-2xl p-4 transition-all',
                isDone
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-card shadow-sm'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium mt-0.5',
                  isDone
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium leading-snug',
                    isDone && 'text-green-700 dark:text-green-400'
                  )}>
                    {sentence.sentence_text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sentence.translation_ru}
                  </p>
                  {total > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all duration-500"
                          style={{ width: `${(understood / total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {understood}/{total}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add more / Limit reached */}
      {canAddMore ? (
        <button
          onClick={onAddMore}
          disabled={isGenerating}
          className="w-full rounded-2xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {lang === 'ru' ? 'Генерируем...' : lang === 'es' ? 'Generando...' : 'Generating...'}
            </>
          ) : (
            ui.addMore
          )}
        </button>
      ) : (
        <div className="w-full rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 py-3 px-4 text-sm text-amber-700 dark:text-amber-400 text-center">
          {limitReached
            ? (lang === 'ru' ? 'Лимит предложений на эту неделю исчерпан. Новые — с понедельника' : lang === 'es' ? 'Has alcanzado el límite de esta semana. Habrá nuevas el lunes' : 'This week\'s sentence limit is used up. New ones on Monday')
            : (lang === 'ru' ? 'Лимит достигнут. Нажмите обновить для новых предложений' : lang === 'es' ? 'Límite alcanzado. Haz clic en actualizar para nuevas oraciones' : 'Limit reached. Click refresh for new sentences')}
        </div>
      )}

      {/* Train button */}
      <Button
        className="w-full h-12 text-base font-medium"
        onClick={onStartTrain}
        disabled={sentences.length === 0}
      >
        {ui.train}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>

    </div>
  )
}

// ─────────────────────────────────────────────
// TRAIN VIEW — тренировка одного предложения
// ─────────────────────────────────────────────

function TrainView({
  sentences,
  currentIndex,
  userProgress,
  lang,
  level,
  onMarkPart,
  onMarkAll,
  onNext,
  onBack,
}: {
  sentences: SentenceWithParts[]
  currentIndex: number
  userProgress: Record<string, any>
  lang: InterfaceLang
  level: Level
  onMarkPart: (sentenceId: string, partId: string) => Promise<void>
  onMarkAll: (sentenceId: string) => Promise<void>
  onNext: () => void
  onBack: () => void
}) {
  const ui = UI[lang] ?? UI.ru
  const sentence = sentences[currentIndex]
  const [showBreakdown, setShowBreakdown] = useState(false)
  const isLastSentence = currentIndex === sentences.length - 1

  // Reset breakdown when sentence changes
  useEffect(() => {
    setShowBreakdown(false)
  }, [currentIndex])

  if (!sentence) return null

  const progress = userProgress[sentence.id]
  const understoodIds = new Set<string>(progress?.understood_parts ?? [])
  const parts = [...(sentence.sentence_parts ?? [])].sort(
    (a, b) => a.order_index - b.order_index
  )

  const understoodCount = parts.filter(p => understoodIds.has(p.id)).length
  const isLowLevel = ['A1', 'A2', 'B1'].includes(level)


  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} / {sentences.length}
          </p>
          {/* Progress bar */}
          <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sentence card */}
      <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">

        {/* Full sentence + speak */}
        <div className="space-y-2">
          <p className="text-2xl font-semibold leading-snug tracking-tight">
            {sentence.sentence_text}
          </p>
          <p className="text-sm text-muted-foreground">
            {sentence.translation_ru}
          </p>
          <button
            onClick={() => speak(sentence.sentence_text, sentence.language)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
            {lang === 'ru' ? 'Послушать' : lang === 'es' ? 'Escuchar' : 'Listen'}
          </button>
        </div>

        {/* Show breakdown button */}
        {!showBreakdown && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowBreakdown(true)}
          >
            {lang === 'ru' ? 'Показать разбор' : lang === 'es' ? 'Ver análisis' : 'Show breakdown'}
          </Button>
        )}

        {/* Breakdown */}
        {showBreakdown && (
          <div className="space-y-3">

            {/* Hint */}
            <div className="rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                💡 {ui.hint}
              </p>
            </div>

            {/* Parts */}
            {parts.map(part => {
              const isUnderstood = understoodIds.has(part.id)
              return (
                <PartCard
                  key={part.id}
                  part={part}
                  isUnderstood={isUnderstood}
                  lang={lang}
                  learningLang={sentence.language}
                  onTap={() => onMarkPart(sentence.id, part.id)}
                  onSpeak={() => speak(part.text, sentence.language)}
                />
              )
            })}

            {/* All understood button */}
            <button
              onClick={() => onMarkAll(sentence.id)}
              className={cn(
                'w-full rounded-xl py-2.5 text-sm font-medium transition-all',
                understoodCount === parts.length
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {understoodCount === parts.length
                ? `✓ ${ui.allUnderstood}`
                : ui.allUnderstood}
            </button>

            {/* Encouragement for low levels */}
            {isLowLevel && (
              <p className="text-center text-xs text-muted-foreground">
                {lang === 'ru'
                  ? 'На начальном уровне нормально не понимать всё — каждая галочка это прогресс! 🎉'
                  : lang === 'es'
                  ? 'En nivel inicial es normal no entenderlo todo — ¡cada ✓ es progreso! 🎉'
                  : 'At beginner level it\'s normal not to understand everything — every ✓ is progress! 🎉'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next button — active only after breakdown shown */}
      {showBreakdown && (
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={onNext}
        >
          {isLastSentence
            ? (lang === 'ru' ? 'Завершить' : lang === 'es' ? 'Finalizar' : 'Finish')
            : ui.next}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────
// PART CARD
// ─────────────────────────────────────────────

function PartCard({
  part,
  isUnderstood,
  lang,
  learningLang,
  onTap,
  onSpeak,
}: {
  part: SentencePart
  isUnderstood: boolean
  lang: InterfaceLang
  learningLang: string
  onTap: () => void
  onSpeak: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 transition-all duration-200 cursor-pointer select-none',
        isUnderstood
          ? 'border-green-500/30 bg-green-500/8'
          : 'border-border bg-background hover:border-border/80'
      )}
      onClick={onTap}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">

          {/* Text + pronunciation */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base">{part.text}</span>
            <span className="text-xs text-muted-foreground">[{part.pronunciation}]</span>
            <button
              onClick={e => { e.stopPropagation(); onSpeak() }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Translation */}
          <p className="text-sm text-muted-foreground mt-0.5">
            {part.translation_ru}
          </p>

          {/* Explanation + tip — always visible */}
          {(part.explanation || part.tip) && (
            <div className="mt-2 space-y-1.5">
              {part.explanation && (
                <p className="text-xs leading-relaxed text-foreground/80">
                  📝 {part.explanation}
                </p>
              )}
              {part.tip && (
                <p className="text-xs leading-relaxed text-foreground/70">
                  💡 {part.tip}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Checkmark */}
        <div className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
          isUnderstood
            ? 'border-green-500 bg-green-500'
            : 'border-muted-foreground/30'
        )}>
          {isUnderstood && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// GENERATING STATE
// ─────────────────────────────────────────────

function GeneratingState({ lang, level }: { lang: InterfaceLang; level: Level }) {
  const ui = UI[lang] ?? UI.ru
  const isLow = ['A1', 'A2'].includes(level)

  return (
    <div className="mx-auto max-w-lg px-4 py-20 flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="space-y-1">
        <p className="font-medium">{ui.generating}</p>
        <p className="text-sm text-muted-foreground">{ui.generatingHint}</p>
      </div>
      {isLow && (
        <p className="text-xs text-muted-foreground max-w-[240px]">
          {lang === 'ru'
            ? 'Подбираем предложения специально для твоего уровня 🎯'
            : lang === 'es'
            ? 'Preparando oraciones para tu nivel 🎯'
            : 'Preparing sentences for your level 🎯'}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────

function SentencesSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-5 w-12 rounded" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-12 rounded-2xl" />
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
  lang,
}: {
  message: string
  onRetry: () => void
  lang: string
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
      <div className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20 text-destructive text-sm text-left whitespace-pre-wrap break-all">
        <p className="font-semibold mb-1">
          {lang === 'ru' ? '⚠️ Ошибка:' : lang === 'es' ? '⚠️ Error:' : '⚠️ Error:'}
        </p>
        {message}
      </div>
      <Button onClick={onRetry} className="w-full h-11 text-sm font-medium">
        {lang === 'ru' ? 'Попробовать снова' : lang === 'es' ? 'Reintentar' : 'Try Again'}
      </Button>
    </div>
  )
}

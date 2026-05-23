'use client'

import { useState, useEffect } from 'react'
import { Volume2, Square } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { getAlphabetData, type Letter, type Digraph } from '@/core/alphabet-data'
import { cn } from '@/lib/utils'
import type { LearningLang, InterfaceLang } from '@/types/database'

function toLegacyLang(lang: LearningLang): 'spanish' | 'english' {
  return lang === 'es' ? 'spanish' : 'english'
}

export default function AlphabetPage() {
  const { profile, activeLanguage } = useUser()

  const learningLang: LearningLang = activeLanguage?.learning_language ?? 'es'
  const interfaceLang: InterfaceLang = profile?.interface_language ?? 'ru'

  const [selected, setSelected] = useState<Letter | Digraph | null>(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCached, setIsCached] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)

  const alphabetData = getAlphabetData(toLegacyLang(learningLang))

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = alphabetData.langCode
    utter.rate = 0.85
    const voices = window.speechSynthesis.getVoices()
    const langPrefix = alphabetData.langCode.split('-')[0]
    const voice = voices.find(v => v.lang.startsWith(langPrefix))
    if (voice) utter.voice = voice
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utter)
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }

  useEffect(() => {
    setSelected(null)
    setExplanation('')
    setError('')
  }, [learningLang])

  const fetchExplanation = async (letterObj: Letter | Digraph) => {
    if (selected?.letter === letterObj.letter && explanation) return
    setSelected(letterObj)
    setExplanation('')
    setError('')
    setIsCached(false)
    setLoading(true)

    try {
      const response = await fetch('/api/alphabet-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter: letterObj.letter,
          name: letterObj.name,
          learningLanguage: learningLang,
          interfaceLanguage: interfaceLang,
        }),
      })

      const data = await response.json()
      if (data.explanation) {
        setExplanation(data.explanation)
        setIsCached(data.cached === true)
      } else {
        setError(uiText.error[interfaceLang])
      }
    } catch {
      setError(uiText.connError[interfaceLang])
    } finally {
      setLoading(false)
    }
  }

  const renderExplanation = (text: string) => {
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      return (
        <p
          key={i}
          className="mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bold }}
        />
      )
    })
  }

  const isSpecial = (item: Letter | Digraph): boolean =>
    'isSpecial' in item && !!item.isSpecial

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">

      {/* ── Header ── */}
      <div className="text-center space-y-1.5">
        <div className="text-2xl leading-none">{alphabetData.flag}</div>
        <h1 className="text-2xl font-bold tracking-tight">
          {alphabetData.title[interfaceLang]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {uiText.subtitle[interfaceLang]}
        </p>
      </div>

      {/* ── Letter grid ── */}
      <div className="rounded-2xl bg-card shadow-sm p-4 space-y-4">

        {/* Alphabet section label */}
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {alphabetData.subtitle[interfaceLang]}
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-1.5">
          {alphabetData.letters.map((l) => (
            <LetterButton
              key={l.letter}
              letter={l.letter}
              name={l.name}
              isSpecial={!!l.isSpecial}
              isSelected={selected?.letter === l.letter}
              onClick={() => fetchExplanation(l)}
            />
          ))}
        </div>

        {/* Digraphs section */}
        <div className="space-y-3 pt-1 border-t border-border/60">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {uiText.digraphs[interfaceLang]}
            </p>
            <p className="text-[0.65rem] italic text-muted-foreground/40">
              {alphabetData.digraphNote[interfaceLang]}
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1.5">
            {alphabetData.digraphs.map((d) => (
              <LetterButton
                key={d.letter}
                letter={d.letter}
                name={d.name}
                isSpecial
                isSelected={selected?.letter === d.letter}
                onClick={() => fetchExplanation(d)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Explanation panel ── */}
      <div className="rounded-2xl bg-card shadow-sm">
        {!selected ? (
          /* Empty placeholder */
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <span
              className="text-[72px] font-black leading-none select-none"
              style={{ color: 'color-mix(in oklch, var(--color-foreground) 8%, transparent)' }}
            >
              Aa
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              {uiText.selectHint[interfaceLang]}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* Letter header row */}
            <div className="flex items-start gap-4 pb-4 border-b border-border/70">

              {/* Big letter */}
              <span className="text-5xl font-black leading-none text-primary shrink-0 pt-0.5">
                {selected.letter}
              </span>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-[17px] font-semibold leading-snug">{selected.name}</p>
                <p className="text-sm text-muted-foreground italic">
                  ≈ «{selected.sound[interfaceLang]}»
                </p>

                {/* Special badge */}
                {isSpecial(selected) && (
                  <span className="inline-block rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-widest text-primary">
                    {uiText.hasQuirks[interfaceLang]}
                  </span>
                )}

                {/* Audio buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => speak(selected.letter)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-primary transition-all cursor-pointer',
                      'hover:border-primary/40 hover:bg-primary/10',
                      speaking && 'border-primary/50 bg-primary/10'
                    )}
                  >
                    <Volume2 className="h-3 w-3" />
                    {uiText.playLetter[interfaceLang]}
                  </button>
                  <button
                    onClick={() => speak(selected.name)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-primary transition-all cursor-pointer',
                      'hover:border-primary/40 hover:bg-primary/10',
                      speaking && 'border-primary/50 bg-primary/10'
                    )}
                  >
                    <Volume2 className="h-3 w-3" />
                    {uiText.playName[interfaceLang]}
                  </button>
                  <button
                    onClick={stopSpeaking}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all cursor-pointer hover:text-foreground hover:border-border/80"
                  >
                    <Square className="h-3 w-3" />
                    {uiText.stop[interfaceLang]}
                  </button>
                </div>
              </div>
            </div>

            {/* Explanation label */}
            <div className="flex items-center gap-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground/45">
                {uiText.explanationBy[interfaceLang]}
              </p>
              {isCached && (
                <span className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[0.58rem] text-muted-foreground/60">
                  {uiText.cached[interfaceLang]}
                </span>
              )}
            </div>

            {/* Loading dots */}
            {loading && (
              <div className="flex items-center gap-1.5 py-1">
                {[0, 160, 320].map(delay => (
                  <span
                    key={delay}
                    className="h-2 w-2 animate-pulse rounded-full bg-primary"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Explanation content */}
            {explanation && !loading && (
              <div className="text-[0.9rem] leading-relaxed text-foreground/75">
                {renderExplanation(explanation)}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// Letter / Digraph button
// ─────────────────────────────────────────────

function LetterButton({
  letter,
  name,
  isSpecial,
  isSelected,
  onClick,
}: {
  letter: string
  name: string
  isSpecial: boolean
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border transition-all duration-150 cursor-pointer select-none',
        isSpecial
          ? [
              'border-primary/20 text-primary',
              'hover:border-primary/40 hover:bg-primary/10',
            ]
          : [
              'border-border text-foreground/80',
              'hover:border-border/60 hover:bg-accent',
            ],
        isSelected && [
          '!border-primary !bg-primary/10',
          'shadow-sm shadow-primary/20',
        ]
      )}
    >
      <span className="text-base font-semibold leading-none">{letter}</span>
      <span className="text-[0.58rem] font-medium lowercase tracking-wide text-muted-foreground/60 mt-0.5">
        {name}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────
// UI strings
// ─────────────────────────────────────────────

const uiText: Record<string, Record<InterfaceLang, string>> = {
  subtitle: {
    ru: 'Нажми на букву — Claude объяснит как читается',
    en: 'Tap a letter — Claude will explain its pronunciation',
    es: 'Toca una letra — Claude explicará su pronunciación',
  },
  digraphs: {
    ru: 'Диграфы',
    en: 'Digraphs',
    es: 'Dígrafos',
  },
  selectHint: {
    ru: 'Выбери букву чтобы увидеть объяснение',
    en: 'Select a letter to see the explanation',
    es: 'Selecciona una letra para ver la explicación',
  },
  hasQuirks: {
    ru: 'с особенностями',
    en: 'has quirks',
    es: 'con peculiaridades',
  },
  playLetter: {
    ru: 'Буква',
    en: 'Letter',
    es: 'Letra',
  },
  playName: {
    ru: 'Название',
    en: 'Name',
    es: 'Nombre',
  },
  stop: {
    ru: 'Стоп',
    en: 'Stop',
    es: 'Parar',
  },
  explanationBy: {
    ru: 'Объяснение от Claude',
    en: 'Explanation by Claude',
    es: 'Explicación de Claude',
  },
  cached: {
    ru: 'из кэша',
    en: 'cached',
    es: 'del caché',
  },
  error: {
    ru: 'Не удалось получить объяснение',
    en: 'Failed to get explanation',
    es: 'No se pudo obtener la explicación',
  },
  connError: {
    ru: 'Ошибка соединения',
    en: 'Connection error',
    es: 'Error de conexión',
  },
}

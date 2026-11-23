'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Volume2, Square } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { getAlphabetData, type Letter, type Digraph } from '@/core/alphabet-data'
import { cn } from '@/lib/utils'
import { getLearningLanguage } from '@/lib/languages'
import { speak, stopSpeaking } from '@/lib/speech'

export default function AlphabetPage() {
  const { interfaceLang, learningLang } = useUser()
  const { t } = useT()


  const [selected, setSelected] = useState<Letter | Digraph | null>(null)
  const [speaking, setSpeaking] = useState(false)

  const alphabetData = getAlphabetData(learningLang)

  const say = (text: string) =>
    speak(text, learningLang, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
    })

  const stop = () => {
    stopSpeaking()
    setSpeaking(false)
  }

  useEffect(() => {
    setSelected(null)
  }, [learningLang])

  // Translations are hidden when the interface language is the language being learned
  const showTranslation = interfaceLang !== learningLang

  const isSpecial = (item: Letter | Digraph): boolean =>
    'isSpecial' in item && !!item.isSpecial

  if (!alphabetData) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{t.alphabet.noAlphabet}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-5">

      {/* ── Header ── */}
      <div className="text-center space-y-1.5">
        <div className="text-2xl leading-none">{getLearningLanguage(learningLang).flag}</div>
        <h1 className="text-2xl font-bold tracking-tight">
          {alphabetData.title[interfaceLang]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.alphabet.subtitle}
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
              onClick={() => setSelected(l)}
            />
          ))}
        </div>

        {/* Digraphs section */}
        <div className="space-y-3 pt-1 border-t border-border/60">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {t.alphabet.digraphs}
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
                onClick={() => setSelected(d)}
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
              {t.alphabet.selectHint}
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
                    {t.alphabet.hasQuirks}
                  </span>
                )}

                {/* Audio buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => say(selected.letter)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-primary transition-all cursor-pointer',
                      'hover:border-primary/40 hover:bg-primary/10',
                      speaking && 'border-primary/50 bg-primary/10'
                    )}
                  >
                    <Volume2 className="h-3 w-3" />
                    {t.alphabet.playLetter}
                  </button>
                  <button
                    onClick={() => say(selected.name)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-primary transition-all cursor-pointer',
                      'hover:border-primary/40 hover:bg-primary/10',
                      speaking && 'border-primary/50 bg-primary/10'
                    )}
                  >
                    <Volume2 className="h-3 w-3" />
                    {t.alphabet.playName}
                  </button>
                  <button
                    onClick={stop}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all cursor-pointer hover:text-foreground hover:border-border/80"
                  >
                    <Square className="h-3 w-3" />
                    {t.alphabet.stop}
                  </button>
                </div>
              </div>
            </div>

            {/* How it sounds */}
            <section className="space-y-1.5">
              <SectionLabel>{t.alphabet.how}</SectionLabel>
              <p className="text-[0.9rem] leading-relaxed text-foreground/75">
                {selected.how[interfaceLang]}
              </p>
            </section>

            {/* Examples */}
            <section className="space-y-1.5">
              <SectionLabel>{t.alphabet.examples}</SectionLabel>
              <ul className="space-y-1">
                {selected.examples.map((ex) => (
                  <li key={ex.word} className="flex items-center gap-2 text-[0.9rem]">
                    <button
                      onClick={() => say(ex.word)}
                      className="text-primary/70 hover:text-primary transition-colors cursor-pointer"
                      aria-label={ex.word}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-semibold text-foreground">{ex.word}</span>
                    {showTranslation && ex.tr[interfaceLang] && (
                      <span className="text-muted-foreground">— {ex.tr[interfaceLang]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Tip */}
            {selected.tip && (
              <section className="rounded-xl bg-primary/5 border border-primary/15 px-3.5 py-2.5 space-y-1">
                <SectionLabel>{t.alphabet.tip}</SectionLabel>
                <p className="text-[0.85rem] leading-relaxed text-foreground/75">
                  {selected.tip[interfaceLang]}
                </p>
              </section>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground/45">
      {children}
    </p>
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

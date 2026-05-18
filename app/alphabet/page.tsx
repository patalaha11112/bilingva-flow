'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { getAlphabetData, type Letter, type Digraph } from '@/core/alphabet-data'
import { cn } from '@/lib/utils'
import type { LearningLang, InterfaceLang } from '@/types/database'

// Маппинг из новых типов БД в старый формат alphabet-data
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
    <div className="flex min-h-[calc(100vh-120px)] flex-col bg-[#0e0c09] text-[#f0e6d3] font-serif">
      {/* Header */}
      <header className="border-b border-[#2a2520] bg-gradient-to-b from-[#1a1510] to-[#0e0c09] px-6 py-8 text-center">
        <div className="mb-3 text-3xl tracking-widest">{alphabetData.flag}</div>
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          {alphabetData.title[interfaceLang]}
        </h1>
        <p className="mt-2 text-sm italic text-[#7a6e62]">
          {uiText.subtitle[interfaceLang]}
        </p>
      </header>

      {/* Main */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_1.4fr]">
        {/* Left — Letters */}
        <div className="overflow-y-auto border-r border-[#2a2520] px-5 py-6">
          <div className="mb-4 text-xs uppercase tracking-widest text-[#5a5048]">
            {alphabetData.subtitle[interfaceLang]}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2">
            {alphabetData.letters.map((l) => (
              <button
                key={l.letter}
                onClick={() => fetchExplanation(l)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-0.5 rounded border transition-all cursor-pointer',
                  'bg-[#141210] hover:bg-[#1e1a14] hover:-translate-y-0.5',
                  l.isSpecial
                    ? 'border-[#3d2e1c] text-[#c9813a]'
                    : 'border-[#2a2520] text-[#c4b8aa]',
                  selected?.letter === l.letter && 'border-[#c9813a] bg-[#1e1a14] shadow-lg shadow-[#c9813a]/10'
                )}
              >
                <span className="text-xl font-bold leading-none">{l.letter}</span>
                <span className="text-[0.55rem] font-light lowercase tracking-wide text-[#5a5048]">
                  {l.name}
                </span>
              </button>
            ))}
          </div>

          {/* Digraphs */}
          <div className="mt-6 text-xs uppercase tracking-widest text-[#5a5048]">
            {uiText.digraphs[interfaceLang]}
          </div>
          <div className="mt-1 mb-3 text-[0.7rem] italic text-[#5a5048]/70">
            {alphabetData.digraphNote[interfaceLang]}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-2">
            {alphabetData.digraphs.map((d) => (
              <button
                key={d.letter}
                onClick={() => fetchExplanation(d)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-0.5 rounded border transition-all cursor-pointer',
                  'border-[#3d2e1c] bg-[#141210] text-[#c9813a]',
                  'hover:bg-[#1e1a14] hover:-translate-y-0.5',
                  selected?.letter === d.letter && 'border-[#c9813a] bg-[#1e1a14] shadow-lg shadow-[#c9813a]/10'
                )}
              >
                <span className="text-lg font-bold leading-none">{d.letter}</span>
                <span className="text-[0.55rem] font-light lowercase tracking-wide text-[#5a5048]">
                  {d.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Explanation */}
        <div className="flex flex-col overflow-y-auto bg-[#0e0c09] px-6 py-8 md:px-8">
          {!selected ? (
            <div className="m-auto text-center text-[#3a342e]">
              <div className="text-7xl font-black leading-none opacity-30">Aa</div>
              <p className="mt-3 text-sm italic">{uiText.selectHint[interfaceLang]}</p>
            </div>
          ) : (
            <>
              {/* Letter header */}
              <div className="mb-6 flex items-baseline gap-4 border-b border-[#2a2520] pb-5">
                <div className="text-6xl font-black leading-none text-[#c9813a]">
                  {selected.letter}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xl font-semibold">{selected.name}</div>
                  <div className="text-sm italic text-[#7a6e62]">
                    ≈ «{selected.sound[interfaceLang]}»
                  </div>
                  {isSpecial(selected) && (
                    <span className="mt-1 inline-block w-fit rounded border border-[#3d2e1c] bg-[#2a1e0e] px-2 py-0.5 text-[0.65rem] uppercase tracking-widest text-[#c9813a]">
                      {uiText.hasQuirks[interfaceLang]}
                    </span>
                  )}
                  {/* Audio buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => speak(selected.letter)}
                      className={cn(
                        'rounded border border-[#3d2e1c] bg-[#1e1a14] px-3 py-1.5 text-xs text-[#c9813a] transition-all cursor-pointer',
                        'hover:border-[#c9813a] hover:bg-[#2a1e0e]',
                        speaking && 'border-[#c9813a] shadow-md shadow-[#c9813a]/20'
                      )}
                    >
                      {speaking ? '🔊' : '🔈'} {uiText.playLetter[interfaceLang]}
                    </button>
                    <button
                      onClick={() => speak(selected.name)}
                      className={cn(
                        'rounded border border-[#3d2e1c] bg-[#1e1a14] px-3 py-1.5 text-xs text-[#c9813a] transition-all cursor-pointer',
                        'hover:border-[#c9813a] hover:bg-[#2a1e0e]',
                        speaking && 'border-[#c9813a] shadow-md shadow-[#c9813a]/20'
                      )}
                    >
                      {speaking ? '🔊' : '🔈'} {uiText.playName[interfaceLang]}
                    </button>
                    <button
                      onClick={stopSpeaking}
                      className="rounded border border-[#2a2520] bg-[#1e1a14] px-3 py-1.5 text-xs text-[#7a6e62] transition-all cursor-pointer hover:border-[#5a5048] hover:text-[#f0e6d3]"
                    >
                      ■ {uiText.stop[interfaceLang]}
                    </button>
                  </div>
                </div>
              </div>

              {/* Explanation label */}
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-[#3a342e]">
                <span>{uiText.explanationBy[interfaceLang]}</span>
                {isCached && (
                  <span className="rounded bg-[#1e1a14] border border-[#2a2520] px-1.5 py-0.5 text-[#5a5048] normal-case tracking-normal">
                    {uiText.cached[interfaceLang]}
                  </span>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex gap-2 py-4">
                  {[0, 200, 400].map(delay => (
                    <span
                      key={delay}
                      className="h-2 w-2 animate-pulse rounded-full bg-[#c9813a]"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}

              {/* Error */}
              {error && <p className="text-sm italic text-red-400">{error}</p>}

              {/* Content */}
              {explanation && !loading && (
                <div className="text-[0.95rem] leading-relaxed text-[#c4b8aa]">
                  {renderExplanation(explanation)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// UI strings (вместо хардкода по всему файлу)
// ─────────────────────────────────────────────
const uiText: Record<string, Record<InterfaceLang, string>> = {
  subtitle: {
    ru: 'Нажми на букву — Claude объяснит как читается',
    en: 'Click a letter — Claude will explain pronunciation',
    es: 'Haz clic en una letra — Claude explicará la pronunciación',
  },
  digraphs: {
    ru: 'Диграфы',
    en: 'Digraphs',
    es: 'Dígrafos',
  },
  selectHint: {
    ru: 'Выбери любую букву слева',
    en: 'Select any letter on the left',
    es: 'Selecciona cualquier letra',
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

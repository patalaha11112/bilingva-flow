'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/core/app-context'
import { getAlphabetData, type Letter, type Digraph } from '@/core/alphabet-data'
import { cn } from '@/lib/utils'

export default function AlphabetPage() {
  const { state } = useApp()
  const { profile } = state
  
  const [selected, setSelected] = useState<Letter | Digraph | null>(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)

  const alphabetData = getAlphabetData(profile.learningLanguage)
  const interfaceLang = profile.interfaceLanguage

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
  }, [profile.learningLanguage])

  const fetchExplanation = async (letterObj: Letter | Digraph) => {
    if (selected?.letter === letterObj.letter && explanation) return
    setSelected(letterObj)
    setExplanation('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/alphabet-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter: letterObj.letter,
          name: letterObj.name,
          learningLanguage: profile.learningLanguage,
          interfaceLanguage: interfaceLang,
        }),
      })

      const data = await response.json()
      if (data.explanation) {
        setExplanation(data.explanation)
      } else if (data.error) {
        setError(data.error)
      } else {
        setError(interfaceLang === 'ru' 
          ? 'Не удалось получить объяснение' 
          : interfaceLang === 'en' 
            ? 'Failed to get explanation' 
            : 'No se pudo obtener la explicación')
      }
    } catch {
      setError(interfaceLang === 'ru' 
        ? 'Ошибка соединения' 
        : interfaceLang === 'en' 
          ? 'Connection error' 
          : 'Error de conexión')
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

  const isSpecial = (item: Letter | Digraph): boolean => {
    return 'isSpecial' in item && !!item.isSpecial
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col bg-[#0e0c09] text-[#f0e6d3] font-serif">
      {/* Header */}
      <header className="border-b border-[#2a2520] bg-gradient-to-b from-[#1a1510] to-[#0e0c09] px-6 py-8 text-center">
        <div className="mb-3 text-3xl tracking-widest">{alphabetData.flag}</div>
        <h1 className="font-display text-3xl font-black tracking-tight md:text-4xl">
          {alphabetData.title[interfaceLang]}
        </h1>
        <p className="mt-2 text-sm italic text-[#7a6e62]">
          {interfaceLang === 'ru' 
            ? 'Нажми на букву — Claude объяснит как читается' 
            : interfaceLang === 'en'
              ? 'Click a letter — Claude will explain pronunciation'
              : 'Haz clic en una letra — Claude explicará la pronunciación'}
        </p>
      </header>

      {/* Main content */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_1.4fr]">
        {/* Left panel - Letters */}
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
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded border transition-all cursor-pointer",
                  "bg-[#141210] hover:bg-[#1e1a14] hover:-translate-y-0.5",
                  l.isSpecial 
                    ? "border-[#3d2e1c] text-[#c9813a]" 
                    : "border-[#2a2520] text-[#c4b8aa]",
                  selected?.letter === l.letter && "border-[#c9813a] bg-[#1e1a14] shadow-lg shadow-[#c9813a]/10"
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
            {interfaceLang === 'ru' ? 'Диграфы' : interfaceLang === 'en' ? 'Digraphs' : 'Dígrafos'}
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
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded border transition-all cursor-pointer",
                  "border-[#3d2e1c] bg-[#141210] text-[#c9813a]",
                  "hover:bg-[#1e1a14] hover:-translate-y-0.5",
                  selected?.letter === d.letter && "border-[#c9813a] bg-[#1e1a14] shadow-lg shadow-[#c9813a]/10"
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

        {/* Right panel - Explanation */}
        <div className="flex flex-col overflow-y-auto bg-[#0e0c09] px-6 py-8 md:px-8">
          {!selected ? (
            <div className="m-auto text-center text-[#3a342e]">
              <div className="text-7xl font-black leading-none opacity-30">Aa</div>
              <p className="mt-3 text-sm italic">
                {interfaceLang === 'ru' 
                  ? 'Выбери любую букву слева' 
                  : interfaceLang === 'en'
                    ? 'Select any letter on the left'
                    : 'Selecciona cualquier letra'}
              </p>
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
                    {interfaceLang === 'ru' ? '≈' : '≈'} «{selected.sound[interfaceLang]}»
                  </div>
                  {isSpecial(selected) && (
                    <span className="mt-1 inline-block w-fit rounded border border-[#3d2e1c] bg-[#2a1e0e] px-2 py-0.5 text-[0.65rem] uppercase tracking-widest text-[#c9813a]">
                      {interfaceLang === 'ru' 
                        ? 'с особенностями' 
                        : interfaceLang === 'en'
                          ? 'has quirks'
                          : 'con peculiaridades'}
                    </span>
                  )}
                  {/* Audio buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => speak(selected.letter)}
                      className={cn(
                        "rounded border border-[#3d2e1c] bg-[#1e1a14] px-3 py-1.5 text-xs text-[#c9813a] transition-all cursor-pointer",
                        "hover:border-[#c9813a] hover:bg-[#2a1e0e]",
                        speaking && "border-[#c9813a] shadow-md shadow-[#c9813a]/20"
                      )}
                    >
                      {speaking ? '🔊' : '🔈'} {interfaceLang === 'ru' ? 'Буква' : interfaceLang === 'en' ? 'Letter' : 'Letra'}
                    </button>
                    <button
                      onClick={() => speak(selected.name)}
                      className={cn(
                        "rounded border border-[#3d2e1c] bg-[#1e1a14] px-3 py-1.5 text-xs text-[#c9813a] transition-all cursor-pointer",
                        "hover:border-[#c9813a] hover:bg-[#2a1e0e]",
                        speaking && "border-[#c9813a] shadow-md shadow-[#c9813a]/20"
                      )}
                    >
                      {speaking ? '🔊' : '🔈'} {interfaceLang === 'ru' ? 'Название' : interfaceLang === 'en' ? 'Name' : 'Nombre'}
                    </button>
                    <button
                      onClick={stopSpeaking}
                      className="rounded border border-[#2a2520] bg-[#1e1a14] px-3 py-1.5 text-xs text-[#7a6e62] transition-all cursor-pointer hover:border-[#5a5048] hover:text-[#f0e6d3]"
                    >
                      ■ {interfaceLang === 'ru' ? 'Стоп' : 'Stop'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Explanation label */}
              <div className="mb-4 text-xs uppercase tracking-widest text-[#3a342e]">
                {interfaceLang === 'ru' 
                  ? 'Объяснение от Claude' 
                  : interfaceLang === 'en'
                    ? 'Explanation by Claude'
                    : 'Explicación de Claude'}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex gap-2 py-4">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9813a]" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9813a]" style={{ animationDelay: '200ms' }} />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9813a]" style={{ animationDelay: '400ms' }} />
                </div>
              )}

              {/* Error */}
              {error && <p className="text-sm italic text-red-400">{error}</p>}

              {/* Explanation content */}
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

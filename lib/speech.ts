import { getLearningLanguage, type LearningLang } from '@/lib/languages'

interface SpeakOptions {
  rate?: number
  onStart?: () => void
  onEnd?: () => void
}

/** Speaks text with a voice for the given learning language, if the browser supports it */
export function speak(text: string, language: LearningLang, { rate = 0.85, onStart, onEnd }: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()

  const locale = getLearningLanguage(language).ttsLocale
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = locale
  utter.rate = rate

  const voices = window.speechSynthesis.getVoices()
  const voice =
    voices.find(v => v.lang === locale) ??
    voices.find(v => v.lang.startsWith(locale.split('-')[0]))
  if (voice) utter.voice = voice

  utter.onstart = () => onStart?.()
  utter.onend = () => onEnd?.()
  utter.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

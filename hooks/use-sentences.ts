import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  SentenceWithParts,
  UserSentence,
  LearningLang,
  Level,
  InterfaceLang,
} from '@/types/database'

interface UseSentencesReturn {
  // Data
  sentences: SentenceWithParts[]
  currentSentence: SentenceWithParts | null
  currentIndex: number
  userProgress: Record<string, UserSentence>

  // State
  isLoading: boolean
  isGenerating: boolean
  error: string | null

  // Actions
  markPartUnderstood: (sentenceId: string, partId: string) => Promise<void>
  markAllUnderstood: (sentenceId: string) => Promise<void>
  nextSentence: () => void
  addMoreSentences: () => Promise<void>
  refetch: () => Promise<void>
}

interface UseSentencesParams {
  language: LearningLang
  level: Level
  topicId?: string
  customTopic?: string
  interfaceLanguage: InterfaceLang
  enabled?: boolean
}

export function useSentences({
  language,
  level,
  topicId,
  customTopic,
  interfaceLanguage,
  enabled = true,
}: UseSentencesParams): UseSentencesReturn {
  const supabase = createClient()

  const [sentences, setSentences] = useState<SentenceWithParts[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userProgress, setUserProgress] = useState<Record<string, UserSentence>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSentences = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)

      // Запрашиваем предложения через API route
      // (там логика: БД → если нет → Gemini → сохранить → вернуть)
      setIsGenerating(true)
      const res = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          level,
          topic_id: topicId,
          custom_topic: customTopic,
          interface_language: interfaceLanguage,
        }),
      })

      setIsGenerating(false)

      if (!res.ok) {
        let errorMsg = 'Failed to fetch sentences'
        try {
          const errData = await res.json() as { error?: string; details?: string }
          if (errData && errData.error) {
            errorMsg = errData.details ? `${errData.error}: ${errData.details}` : errData.error
          }
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json() as { sentences: SentenceWithParts[] }

      // Сортируем части по order_index
      const sorted = data.sentences.map(s => ({
        ...s,
        sentence_parts: [...(s.sentence_parts ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }))

      setSentences(sorted)
      setCurrentIndex(0)

      // Загружаем прогресс пользователя по этим предложениям
      if (sorted.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const ids = sorted.map(s => s.id)
        const { data: progressData } = await supabase
          .from('user_sentences')
          .select('*')
          .eq('user_id', user.id)
          .in('sentence_id', ids)

        const progressMap: Record<string, UserSentence> = {}
        for (const p of progressData ?? []) {
          progressMap[p.sentence_id] = p
        }
        setUserProgress(progressMap)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsGenerating(false)
    } finally {
      setIsLoading(false)
    }
  }, [language, level, topicId, customTopic, interfaceLanguage, enabled])

  useEffect(() => {
    fetchSentences()
  }, [fetchSentences])

  // Отметить часть как понятую
  const markPartUnderstood = async (sentenceId: string, partId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const current = userProgress[sentenceId]
    const currentParts = current?.understood_parts ?? []

    // Тоггл: если уже отмечена — убираем, иначе добавляем
    let newParts: string[]
    if (currentParts.includes(partId)) {
      newParts = currentParts.filter(id => id !== partId)
    } else {
      newParts = [...currentParts, partId]
    }

    const sentence = sentences.find(s => s.id === sentenceId)
    const totalParts = sentence?.sentence_parts?.length ?? 0
    const allUnderstood = newParts.length >= totalParts

    const { data, error } = await supabase
      .from('user_sentences')
      .upsert({
        user_id: user.id,
        sentence_id: sentenceId,
        language,
        understood_parts: newParts,
        all_understood: allUnderstood,
        times_shown: (current?.times_shown ?? 0) + (current ? 0 : 1),
        last_shown_at: new Date().toISOString(),
      }, { onConflict: 'user_id,sentence_id' })
      .select()
      .single()

    if (!error && data) {
      setUserProgress(prev => ({ ...prev, [sentenceId]: data }))
    }
  }

  // Отметить все части как понятые (тоггл: если все уже отмечены — снять все)
  const markAllUnderstood = async (sentenceId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const sentence = sentences.find(s => s.id === sentenceId)
    if (!sentence) return

    const allPartIds = (sentence.sentence_parts ?? []).map(p => p.id)
    const current = userProgress[sentenceId]
    const currentParts = current?.understood_parts ?? []

    // Тоггл: если все уже отмечены — снимаем все, иначе отмечаем все
    const isAllCurrentlyUnderstood = currentParts.length >= allPartIds.length
    const newParts = isAllCurrentlyUnderstood ? [] : allPartIds
    const allUnderstood = !isAllCurrentlyUnderstood

    const { data, error } = await supabase
      .from('user_sentences')
      .upsert({
        user_id: user.id,
        sentence_id: sentenceId,
        language,
        understood_parts: newParts,
        all_understood: allUnderstood,
        times_shown: (current?.times_shown ?? 0) + (current ? 0 : 1),
        last_shown_at: new Date().toISOString(),
      }, { onConflict: 'user_id,sentence_id' })
      .select()
      .single()

    if (!error && data) {
      setUserProgress(prev => ({ ...prev, [sentenceId]: data }))
    }
  }

  // Следующее предложение
  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // Все предложения просмотрены — подгружаем новые
      fetchSentences()
    }
  }

  // Добавить ещё предложения (без замены текущих)
  const addMoreSentences = async () => {
    if (!enabled) return

    try {
      setIsGenerating(true)
      setError(null)

      const res = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          level,
          topic_id: topicId,
          custom_topic: customTopic,
          interface_language: interfaceLanguage,
          get_new: true, // Параметр, чтобы получить новые предложения
        }),
      })

      if (!res.ok) {
        let errorMsg = 'Failed to fetch more sentences'
        try {
          const errData = await res.json() as { error?: string; details?: string }
          if (errData && errData.error) {
            errorMsg = errData.details ? `${errData.error}: ${errData.details}` : errData.error
          }
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json() as { sentences: SentenceWithParts[] }

      // Сортируем части по order_index
      const sorted = data.sentences.map(s => ({
        ...s,
        sentence_parts: [...(s.sentence_parts ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }))

      // Добавляем новые предложения к существующим
      setSentences(prev => [...prev, ...sorted])

      // Загружаем прогресс пользователя по новым предложениям
      if (sorted.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const ids = sorted.map(s => s.id)
        const { data: progressData } = await supabase
          .from('user_sentences')
          .select('*')
          .eq('user_id', user.id)
          .in('sentence_id', ids)

        const newProgress: Record<string, UserSentence> = {}
        for (const p of progressData ?? []) {
          newProgress[p.sentence_id] = p
        }
        setUserProgress(prev => ({ ...prev, ...newProgress }))
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    sentences,
    currentSentence: sentences[currentIndex] ?? null,
    currentIndex,
    userProgress,
    isLoading,
    isGenerating,
    error,
    markPartUnderstood,
    markAllUnderstood,
    nextSentence,
    addMoreSentences,
    refetch: fetchSentences,
  }
}

import { useState, useEffect, useCallback } from 'react'
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
  weeklyCount: number
  weeklyLimit: number

  // State
  isLoading: boolean
  isGenerating: boolean
  error: string | null

  // Actions
  markPartUnderstood: (sentenceId: string, partId: string) => Promise<void>
  markAllUnderstood: (sentenceId: string) => Promise<void>
  nextSentence: () => void
  addMoreSentences: () => Promise<void>
  refreshSentences: () => Promise<void>
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
  const [sentences, setSentences] = useState<SentenceWithParts[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userProgress, setUserProgress] = useState<Record<string, UserSentence>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeklyCount, setWeeklyCount] = useState(0)
  const [weeklyLimit] = useState(10)

  const fetchSentences = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      setError(null)

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
          const errData = await res.json() as { error?: string }
          if (errData && errData.error) {
            errorMsg = errData.error
          }
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json() as {
        sentences: SentenceWithParts[]
        weeklyLimit?: { total: number; max: number }
        userProgress?: Record<string, UserSentence>
      }

      // Sort parts by order_index
      const sorted = data.sentences.map(s => ({
        ...s,
        sentence_parts: [...(s.sentence_parts ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }))

      setSentences(sorted)
      setCurrentIndex(0)

      if (data.weeklyLimit) {
        setWeeklyCount(data.weeklyLimit.total)
      }

      if (data.userProgress) {
        setUserProgress(data.userProgress)
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

  const markPartUnderstood = async (sentenceId: string, partId: string) => {
    // Optimistic update — toggle immediately so the UI responds on click
    setUserProgress(prev => {
      const current = prev[sentenceId]
      const currentParts: string[] = (current?.understood_parts as string[]) ?? []
      const newParts = currentParts.includes(partId)
        ? currentParts.filter(id => id !== partId)
        : [...currentParts, partId]
      return {
        ...prev,
        [sentenceId]: { ...(current ?? {}), understood_parts: newParts, sentence_id: sentenceId } as UserSentence,
      }
    })

    // Persist in background; on success sync the authoritative state from server
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence_id: sentenceId, part_id: partId, language }),
      })
      if (!res.ok) return
      const data = await res.json() as { progress: UserSentence }
      if (data.progress) {
        setUserProgress(prev => ({ ...prev, [sentenceId]: data.progress }))
      }
    } catch { /* optimistic state stays */ }
  }

  const markAllUnderstood = async (sentenceId: string) => {
    const sentence = sentences.find(s => s.id === sentenceId)
    const allPartIds = (sentence?.sentence_parts ?? []).map(p => p.id)

    // Optimistic toggle
    setUserProgress(prev => {
      const current = prev[sentenceId]
      const currentParts: string[] = (current?.understood_parts as string[]) ?? []
      const isAll = allPartIds.length > 0 && currentParts.length >= allPartIds.length
      const newParts = isAll ? [] : allPartIds
      return {
        ...prev,
        [sentenceId]: { ...(current ?? {}), understood_parts: newParts, all_understood: !isAll, sentence_id: sentenceId } as UserSentence,
      }
    })

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence_id: sentenceId, mark_all: true, language }),
      })
      if (!res.ok) return
      const data = await res.json() as { progress: UserSentence }
      if (data.progress) {
        setUserProgress(prev => ({ ...prev, [sentenceId]: data.progress }))
      }
    } catch { /* optimistic state stays */ }
  }

  // Next sentence in training mode
  const nextSentence = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Add more sentences to the current week (up to limit)
  const addMoreSentences = async () => {
    if (!enabled || weeklyCount >= weeklyLimit) return

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
          add_count: 1,
        }),
      })

      if (!res.ok) {
        let errorMsg = 'Failed to fetch more sentences'
        try {
          const errData = await res.json() as { error?: string }
          if (errData && errData.error) {
            errorMsg = errData.error
          }
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json() as {
        sentences: SentenceWithParts[]
        weeklyLimit?: { total: number; max: number }
        userProgress?: Record<string, UserSentence>
      }

      const sorted = data.sentences.map(s => ({
        ...s,
        sentence_parts: [...(s.sentence_parts ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }))

      // Add new sentences to existing
      setSentences(prev => [...prev, ...sorted])

      if (data.weeklyLimit) {
        setWeeklyCount(data.weeklyLimit.total)
      }

      if (data.userProgress) {
        setUserProgress(prev => ({ ...prev, ...data.userProgress }))
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  // Refresh: deactivate current, get 5 new ones
  const refreshSentences = async () => {
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
          dev_reset: true,
        }),
      })

      if (!res.ok) {
        let errorMsg = 'Failed to refresh sentences'
        try {
          const errData = await res.json() as { error?: string }
          if (errData && errData.error) {
            errorMsg = errData.error
          }
        } catch {}
        throw new Error(errorMsg)
      }

      const data = await res.json() as {
        sentences: SentenceWithParts[]
        weeklyLimit?: { total: number; max: number }
        userProgress?: Record<string, UserSentence>
      }

      const sorted = data.sentences.map(s => ({
        ...s,
        sentence_parts: [...(s.sentence_parts ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }))

      // Replace with new sentences
      setSentences(sorted)
      setCurrentIndex(0)

      if (data.weeklyLimit) {
        setWeeklyCount(data.weeklyLimit.total)
      }

      if (data.userProgress) {
        setUserProgress(data.userProgress)
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
    weeklyCount,
    weeklyLimit,
    isLoading,
    isGenerating,
    error,
    markPartUnderstood,
    markAllUnderstood,
    nextSentence,
    addMoreSentences,
    refreshSentences,
    refetch: fetchSentences,
  }
}

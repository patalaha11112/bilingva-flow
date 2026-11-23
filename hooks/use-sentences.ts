import { useState, useEffect, useCallback, useRef } from 'react'
import { getTimeZone } from '@/lib/format'
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
  /** The server refused more sentences this week */
  limitReached: boolean

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
  const [weeklyLimit, setWeeklyLimit] = useState(10)
  const [limitReached, setLimitReached] = useState(false)

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
        setWeeklyLimit(data.weeklyLimit.max)
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

  // Latest progress for computing toggles, and a queue so saves reach the server in click order
  const progressRef = useRef(userProgress)
  progressRef.current = userProgress
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  const setUnderstoodParts = (sentenceId: string, parts: string[], allUnderstood: boolean) => {
    const updated = {
      ...progressRef.current,
      [sentenceId]: {
        ...(progressRef.current[sentenceId] ?? {}),
        sentence_id: sentenceId,
        understood_parts: parts,
        all_understood: allUnderstood,
      } as UserSentence,
    }
    progressRef.current = updated
    setUserProgress(updated)

    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence_id: sentenceId, understood_parts: parts, language, tz: getTimeZone() }),
        })
        if (!res.ok) console.error('save progress:', res.status, await res.text())
      } catch (err) {
        console.error('save progress:', err)
      }
    })
    return saveQueue.current
  }

  const partIdsOf = (sentenceId: string) =>
    (sentences.find(s => s.id === sentenceId)?.sentence_parts ?? []).map(p => p.id)

  const markPartUnderstood = (sentenceId: string, partId: string) => {
    const allPartIds = partIdsOf(sentenceId)
    const current = progressRef.current[sentenceId]?.understood_parts ?? []
    const parts = current.includes(partId)
      ? current.filter(id => id !== partId)
      : [...current, partId]
    return setUnderstoodParts(sentenceId, parts, allPartIds.length > 0 && parts.length >= allPartIds.length)
  }

  const markAllUnderstood = (sentenceId: string) => {
    const allPartIds = partIdsOf(sentenceId)
    const current = progressRef.current[sentenceId]?.understood_parts ?? []
    const isAll = allPartIds.length > 0 && current.length >= allPartIds.length
    return setUnderstoodParts(sentenceId, isAll ? [] : allPartIds, !isAll)
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

      if (res.status === 429) {
        setLimitReached(true)
        return
      }

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
        setWeeklyLimit(data.weeklyLimit.max)
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
          refresh: true,
        }),
      })

      if (res.status === 429) {
        setLimitReached(true)
        return
      }

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
        setWeeklyLimit(data.weeklyLimit.max)
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
    limitReached,
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

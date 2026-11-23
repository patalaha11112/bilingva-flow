import { useState, useEffect, useCallback, useRef } from 'react'
import { getTimeZone } from '@/lib/format'
import type {
  SentenceWithParts,
  UserSentence,
  LearningLang,
  Level,
  InterfaceLang,
} from '@/types/database'

/** The current sentence set as returned by /api/sentences */
interface SetInfo {
  id: string
  size: number
  max: number
  /** All sentences understood today: the next set opens tomorrow */
  completedToday: boolean
}

interface UseSentencesReturn {
  sentences: SentenceWithParts[]
  userProgress: Record<string, UserSentence>
  set: SetInfo | null
  /** The server refused more sentences today */
  limitReached: boolean

  isLoading: boolean
  isGenerating: boolean
  error: string | null

  markPartUnderstood: (sentenceId: string, partId: string) => Promise<void>
  markAllUnderstood: (sentenceId: string) => Promise<void>
  /** The breakdown of a sentence was opened in training (counts for today's goal) */
  markViewed: (sentenceId: string) => void
  addMoreSentences: () => Promise<void>
  skipSet: () => Promise<void>
  refetch: () => Promise<void>
}

interface UseSentencesParams {
  language: LearningLang
  level: Level
  interfaceLanguage: InterfaceLang
  enabled?: boolean
}

type SetResponse = {
  sentences: SentenceWithParts[]
  userProgress?: Record<string, UserSentence>
  set: SetInfo
}

export function useSentences({
  language,
  level,
  interfaceLanguage,
  enabled = true,
}: UseSentencesParams): UseSentencesReturn {
  const [sentences, setSentences] = useState<SentenceWithParts[]>([])
  const [userProgress, setUserProgress] = useState<Record<string, UserSentence>>({})
  const [set, setSet] = useState<SetInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  /** Loads the set; `action` adds sentences or skips the set. Returns false on the daily limit. */
  const request = useCallback(async (action: { add_count?: number; skip?: boolean } = {}) => {
    const res = await fetch('/api/sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, level, interface_language: interfaceLanguage, tz: getTimeZone(), ...action }),
    })
    if (res.status === 429) {
      setLimitReached(true)
      return false
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(data.error || 'Failed to load sentences')
    }
    const data = await res.json() as SetResponse
    setSentences(data.sentences.map(s => ({
      ...s,
      sentence_parts: [...(s.sentence_parts ?? [])].sort((a, b) => a.order_index - b.order_index),
    })))
    setUserProgress(data.userProgress ?? {})
    setSet(data.set)
    return true
  }, [language, level, interfaceLanguage])

  const fetchSentences = useCallback(async () => {
    if (!enabled) return
    setIsLoading(true)
    setIsGenerating(true)
    setError(null)
    try {
      await request()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }, [enabled, request])

  useEffect(() => {
    fetchSentences()
  }, [fetchSentences])

  const runAction = async (action: { add_count?: number; skip?: boolean }) => {
    if (!enabled) return
    setIsGenerating(true)
    setError(null)
    try {
      await request(action)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

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

  const markViewed = (sentenceId: string) => {
    fetch('/api/progress/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence_id: sentenceId, language, tz: getTimeZone() }),
    }).catch(err => console.error('mark viewed:', err))
  }

  // Follows the progress saved after the set was loaded (the server applies the same rule)
  const completedToday = sentences.length > 0 && sentences.every(s => userProgress[s.id]?.all_understood)

  return {
    sentences,
    userProgress,
    set: set && { ...set, completedToday },
    limitReached,
    isLoading,
    isGenerating,
    error,
    markPartUnderstood,
    markAllUnderstood,
    markViewed,
    addMoreSentences: () => runAction({ add_count: 1 }),
    skipSet: () => runAction({ skip: true }),
    refetch: fetchSentences,
  }
}

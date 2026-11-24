'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { parseLocalDate, toDateString } from '@/lib/format'
import { DAILY_GOALS } from '@/lib/daily-goals'
import {
  DEFAULT_INTERFACE_LANG,
  DEFAULT_LEARNING_LANG,
  INTERFACE_LANG_CODES,
  getInterfaceLanguage,
} from '@/lib/languages'
import type {
  UserProfile,
  UserLanguageSettings,
  UserStats,
  WeekActivity,
  LearningLang,
  Level,
  InterfaceLang,
} from '@/types/database'

interface UserContextValue {
  user: User | null
  profile: UserProfile | null
  activeLanguage: UserLanguageSettings | null
  /** Interface language: profile → browser → DEFAULT_INTERFACE_LANG */
  interfaceLang: InterfaceLang
  /** Active learning language, or the default while none is set */
  learningLang: LearningLang
  level: Level
  stats: UserStats
  weekActivity: WeekActivity[]
  /** Today's progress on the daily path */
  today: TodayProgress
  isLoading: boolean
  error: string | null
  updateProfile: (updates: Partial<Pick<UserProfile, 'interface_language' | 'app_color'>>) => Promise<void>
  updateLevel: (language: LearningLang, level: Level) => Promise<void>
  setActiveLanguage: (language: LearningLang) => Promise<void>
  /** Reloads everything; silent=true keeps current data on screen instead of showing loading state */
  refetch: (options?: { silent?: boolean }) => Promise<void>
}

const EMPTY_STATS: UserStats = {
  sentences_completed: 0,
  back_translations_completed: 0,
  essays_completed: 0,
}

export interface TodayProgress {
  sentencesViewed: number
  backTranslation: boolean
  essay: boolean
}

const EMPTY_TODAY: TodayProgress = { sentencesViewed: 0, backTranslation: false, essay: false }

const UserContext = createContext<UserContextValue | null>(null)

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}

export function UserProvider({ children }: { children: ReactNode }) {
  const supabase = useRef(createClient()).current

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeLanguage, setActiveLanguageState] = useState<UserLanguageSettings | null>(null)
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS)
  const [weekActivity, setWeekActivity] = useState<WeekActivity[]>([])
  const [today, setToday] = useState<TodayProgress>(EMPTY_TODAY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [browserLang, setBrowserLang] = useState<InterfaceLang | null>(null)
  // Id of the user the loaded data belongs to; undefined until the first load finishes
  const loadedUserId = useRef<string | null | undefined>(undefined)

  // navigator is only available after hydration
  useEffect(() => {
    setBrowserLang(detectBrowserLang())
  }, [])

  const fetchAll = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) setIsLoading(true)
      setError(null)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      loadedUserId.current = authUser?.id ?? null
      if (!authUser) {
        setUser(null)
        setProfile(null)
        setActiveLanguageState(null)
        setStats(EMPTY_STATS)
        setWeekActivity([])
        setToday(EMPTY_TODAY)
        return
      }

      setUser(authUser)

      // Profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profileError) {
        console.error('profile fetch:', profileError)
        setProfile(null)
      } else {
        setProfile(profileData ?? null)
      }

      // Active language settings
      const { data: langData } = await supabase
        .from('user_language_settings')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle()

      setActiveLanguageState(langData ?? null)

      // This week (Monday to Sunday, local dates) for the active learning language
      const language = langData?.learning_language ?? DEFAULT_LEARNING_LANG
      const weekDates = getWeekDates(new Date()).map(toDateString)
      const todayStr = toDateString(new Date())
      const weekStartIso = parseLocalDate(weekDates[0]).toISOString()

      const [{ data: activityData }, { count: backTCount }, { count: essayCount }] = await Promise.all([
        supabase
          .from('user_daily_activity')
          .select('date, sentences_done, back_translation_done, essay_done')
          .eq('user_id', authUser.id)
          .eq('language', language)
          .in('date', weekDates),
        supabase
          .from('back_translations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('language', language)
          .gte('back_at', weekStartIso),
        supabase
          .from('user_essays')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('language', language)
          .gte('created_at', weekStartIso),
      ])

      setWeekActivity(weekDates.map(date => {
        const day = activityData?.find(a => a.date === date)
        return {
          date,
          sentences: (day?.sentences_done ?? 0) >= DAILY_GOALS.sentencesViewed,
          back_translation: day?.back_translation_done ?? false,
          essay: day?.essay_done ?? false,
          is_today: date === todayStr,
        }
      }))

      const todayRow = activityData?.find(a => a.date === todayStr)
      setToday({
        sentencesViewed: todayRow?.sentences_done ?? 0,
        backTranslation: todayRow?.back_translation_done ?? false,
        essay: todayRow?.essay_done ?? false,
      })

      setStats({
        sentences_completed: (activityData ?? []).reduce((sum, d) => sum + (d.sentences_done ?? 0), 0),
        back_translations_completed: backTCount ?? 0,
        essays_completed: essayCount ?? 0,
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // The provider outlives page navigation, so reload when a different user signs in or out.
  // Supabase also emits SIGNED_IN for the same user (e.g. on tab focus) — those are ignored.
  useEffect(() => {
    fetchAll()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (loadedUserId.current === undefined) return
      if ((session?.user?.id ?? null) !== loadedUserId.current) fetchAll()
    })
    return () => subscription.unsubscribe()
  }, [fetchAll, supabase])

  const interfaceLang = profile?.interface_language ?? browserLang ?? DEFAULT_INTERFACE_LANG
  const learningLang = activeLanguage?.learning_language ?? DEFAULT_LEARNING_LANG
  const level = activeLanguage?.level ?? 'A1'

  useEffect(() => {
    document.documentElement.lang = getInterfaceLanguage(interfaceLang).locale
  }, [interfaceLang])

  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'interface_language' | 'app_color'>>
  ) => {
    if (!user) return

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const updateLevel = async (language: LearningLang, level: Level) => {
    if (!user) return

    const update = () => supabase
      .from('user_language_settings')
      .update({ level, level_confirmed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('learning_language', language)
      .select()
      .maybeSingle()

    let { data, error } = await update()
    // A new account has no settings row yet: create it (as the active language), then set the level
    if (!error && !data) {
      const { error: rpcError } = await supabase.rpc('set_active_language', { p_language: language })
      if (rpcError) {
        console.error('activate language:', rpcError)
        return
      }
      ;({ data, error } = await update())
    }
    if (error) {
      console.error('update level:', error)
      return
    }

    const row = data as UserLanguageSettings | null
    if (row?.is_active) setActiveLanguageState(row)
  }

  const setActiveLanguage = async (language: LearningLang) => {
    if (!user) return

    // One transaction in the database: deactivates the others, activates (or creates) the target,
    // keeping its saved level (see supabase/migrations, set_active_language)
    const { data, error } = await supabase.rpc('set_active_language', { p_language: language })
    if (error) {
      console.error('activate language:', error)
      return
    }
    setActiveLanguageState(data as UserLanguageSettings)
  }

  const value: UserContextValue = {
    user,
    profile,
    activeLanguage,
    interfaceLang,
    learningLang,
    level,
    stats,
    weekActivity,
    today,
    isLoading,
    error,
    updateProfile,
    updateLevel,
    setActiveLanguage,
    refetch: fetchAll,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function detectBrowserLang(): InterfaceLang | null {
  if (typeof navigator === 'undefined') return null
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.toLowerCase().split('-')[0]
    if ((INTERFACE_LANG_CODES as string[]).includes(code)) return code as InterfaceLang
  }
  return null
}

// Mon–Sun of the current week
function getWeekDates(date: Date): Date[] {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

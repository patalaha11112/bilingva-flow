'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
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
  dialogs_completed: 0,
  essays_completed: 0,
  videos_completed: 0,
}

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

      // Weekly stats
      const now = new Date()
      const weekNumber = getWeekNumber(now)
      const year = now.getFullYear()

      const { data: analyticsData } = await supabase
        .from('user_weekly_analytics')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle()

      setStats(analyticsData
        ? {
            sentences_completed: analyticsData.sentences_completed,
            dialogs_completed: analyticsData.dialogs_completed,
            essays_completed: analyticsData.essays_completed,
            videos_completed: analyticsData.videos_completed,
          }
        : EMPTY_STATS)

      // Daily activity for week rings
      const weekDates = getWeekDates(now)
      const todayStr = now.toISOString().split('T')[0]

      const { data: activityData } = await supabase
        .from('user_daily_activity')
        .select('*')
        .eq('user_id', authUser.id)
        .in('date', weekDates.map(d => d.toISOString().split('T')[0]))

      const activity: WeekActivity[] = weekDates.map(date => {
        const dateStr = date.toISOString().split('T')[0]
        const dayData = activityData?.find(a => a.date === dateStr)

        const hasAny = dayData
          ? dayData.sentences_done > 0 || dayData.dialog_done || dayData.essay_done || dayData.video_done
          : false

        return {
          date: dateStr,
          fully_complete: dayData?.fully_complete ?? false,
          partially_complete: hasAny && !(dayData?.fully_complete),
          is_today: dateStr === todayStr,
        }
      })

      setWeekActivity(activity)

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

    const { error } = await supabase
      .from('user_language_settings')
      .update({ level, level_confirmed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('learning_language', language)

    if (!error && activeLanguage?.learning_language === language) {
      setActiveLanguageState(prev => prev ? { ...prev, level } : null)
    }
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

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
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

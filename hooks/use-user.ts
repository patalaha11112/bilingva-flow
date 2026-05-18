import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  UserProfile,
  UserLanguageSettings,
  UserStats,
  WeekActivity,
  LearningLang,
  Level,
  InterfaceLang,
} from '@/types/database'

interface UseUserReturn {
  profile: UserProfile | null
  activeLanguage: UserLanguageSettings | null
  stats: UserStats
  weekActivity: WeekActivity[]
  isLoading: boolean
  error: string | null
  updateProfile: (updates: Partial<Pick<UserProfile, 'interface_language' | 'app_color'>>) => Promise<void>
  updateLevel: (language: LearningLang, level: Level) => Promise<void>
  setActiveLanguage: (language: LearningLang) => Promise<void>
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeLanguage, setActiveLanguageState] = useState<UserLanguageSettings | null>(null)
  const [stats, setStats] = useState<UserStats>({
    sentences_completed: 0,
    dialogs_completed: 0,
    essays_completed: 0,
    videos_completed: 0,
  })
  const [weekActivity, setWeekActivity] = useState<WeekActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        return
      }

      // Profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Active language settings
      const { data: langData } = await supabase
        .from('user_language_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (langData) setActiveLanguageState(langData)

      // Weekly stats
      const now = new Date()
      const weekNumber = getWeekNumber(now)
      const year = now.getFullYear()

      const { data: analyticsData } = await supabase
        .from('user_weekly_analytics')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle()

      if (analyticsData) {
        setStats({
          sentences_completed: analyticsData.sentences_completed,
          dialogs_completed: analyticsData.dialogs_completed,
          essays_completed: analyticsData.essays_completed,
          videos_completed: analyticsData.videos_completed,
        })
      }

      // Daily activity for week rings
      const weekDates = getWeekDates(now)
      const todayStr = now.toISOString().split('T')[0]

      const { data: activityData } = await supabase
        .from('user_daily_activity')
        .select('*')
        .eq('user_id', user.id)
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'interface_language' | 'app_color'>>
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('user_language_settings')
      .update({ is_active: false })
      .eq('user_id', user.id)

    const { data, error } = await supabase
      .from('user_language_settings')
      .upsert(
        { user_id: user.id, learning_language: language, is_active: true, level: 'A1' },
        { onConflict: 'user_id,learning_language' }
      )
      .select()
      .single()

    if (!error && data) setActiveLanguageState(data)
  }

  return {
    profile,
    activeLanguage,
    stats,
    weekActivity,
    isLoading,
    error,
    updateProfile,
    updateLevel,
    setActiveLanguage,
    refetch: fetchAll,
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Возвращает Mon–Sun текущей недели
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

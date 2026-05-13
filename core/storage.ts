import type { AppState, UserProfile, DayProgress, Stats } from './types'
import { DEFAULT_APP_STATE, STORAGE_KEY } from './constants'

// ===== LOAD / SAVE =====

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_APP_STATE
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_APP_STATE
    
    const parsed = JSON.parse(stored) as AppState
    return { ...DEFAULT_APP_STATE, ...parsed }
  } catch {
    return DEFAULT_APP_STATE
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

// ===== PROFILE =====

export function updateProfile(updates: Partial<UserProfile>): AppState {
  const state = loadState()
  const newState: AppState = {
    ...state,
    profile: { ...state.profile, ...updates },
  }
  saveState(newState)
  return newState
}

// ===== PROGRESS =====

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export function getWeekDates(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

export function getDayProgress(date: string): DayProgress {
  const state = loadState()
  const existing = state.weekProgress.find(p => p.date === date)
  return existing || {
    date,
    sentenceCompleted: false,
    writingCompleted: false,
    videoCompleted: false,
  }
}

export function updateDayProgress(date: string, updates: Partial<DayProgress>): AppState {
  const state = loadState()
  const existingIndex = state.weekProgress.findIndex(p => p.date === date)
  
  const updatedProgress: DayProgress = {
    ...getDayProgress(date),
    ...updates,
  }
  
  const newWeekProgress = [...state.weekProgress]
  if (existingIndex >= 0) {
    newWeekProgress[existingIndex] = updatedProgress
  } else {
    newWeekProgress.push(updatedProgress)
  }
  
  const newState: AppState = {
    ...state,
    weekProgress: newWeekProgress,
  }
  saveState(newState)
  return newState
}

// ===== STATS =====

export function updateStats(updates: Partial<Stats>): AppState {
  const state = loadState()
  const newState: AppState = {
    ...state,
    stats: { ...state.stats, ...updates },
  }
  saveState(newState)
  return newState
}

export function incrementStat(key: keyof Pick<Stats, 'totalSentences' | 'totalWritings' | 'totalVideos'>): AppState {
  const state = loadState()
  const newState: AppState = {
    ...state,
    stats: {
      ...state.stats,
      [key]: state.stats[key] + 1,
    },
  }
  saveState(newState)
  return newState
}

// ===== RESET =====

export function resetProgress(): AppState {
  const state = loadState()
  const newState: AppState = {
    ...DEFAULT_APP_STATE,
    profile: {
      ...state.profile,
      onboardingCompleted: false,
    },
  }
  saveState(newState)
  return newState
}

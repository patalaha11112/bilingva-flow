'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppState, UserProfile, Interest } from './types'
import { DEFAULT_APP_STATE } from './constants'
import { loadState, saveState, resetProgress as resetStorageProgress } from './storage'
import { t } from './i18n'

interface AppContextValue {
  state: AppState
  isLoading: boolean
  updateProfile: (updates: Partial<UserProfile>) => void
  toggleInterest: (interest: Interest) => void
  resetProgress: () => void
  translate: (key: Parameters<typeof t>[0]) => string
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    setIsLoading(false)
  }, [])

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(prev => {
      const newState = {
        ...prev,
        profile: { ...prev.profile, ...updates },
      }
      saveState(newState)
      return newState
    })
  }

  const toggleInterest = (interest: Interest) => {
    setState(prev => {
      const currentInterests = prev.profile.interests
      const newInterests = currentInterests.includes(interest)
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest]
      
      const newState = {
        ...prev,
        profile: { ...prev.profile, interests: newInterests },
      }
      saveState(newState)
      return newState
    })
  }

  const resetProgress = () => {
    const newState = resetStorageProgress()
    setState(newState)
  }

  const translate = (key: Parameters<typeof t>[0]) => {
    return t(key, state.profile.interfaceLanguage)
  }

  return (
    <AppContext.Provider value={{ state, isLoading, updateProfile, toggleInterest, resetProgress, translate }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

/** Pages a new user may open before choosing a language and level */
const OPEN_PATHS = ['/welcome', '/level-test', '/login', '/register', '/auth']

/** A signed-in user without a learning language goes to the welcome screen first */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, activeLanguage, isLoading, error } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  const needsOnboarding = !isLoading && !error && !!user && !activeLanguage
    && !OPEN_PATHS.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (needsOnboarding) router.replace('/welcome')
  }, [needsOnboarding, router])

  return needsOnboarding ? null : <>{children}</>
}

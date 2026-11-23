'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { AuthError } from '@supabase/supabase-js'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { refetch } = useUser()
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(authErrorText(error, t.auth.errors))
      setLoading(false)
    } else {
      // Load the profile before leaving, so the home page doesn't see a signed-out state
      await refetch()
      router.push('/')
      router.refresh()
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  async function handleApple() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t.auth.loginTitle}</h1>
          <p className="text-muted-foreground mt-1">{t.auth.loginSubtitle}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? t.auth.loggingIn : t.auth.loginButton}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t.auth.or}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={handleGoogle}>
            {t.auth.loginWithGoogle}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="underline">{t.auth.registerLink}</Link>
        </p>
      </div>
    </div>
  )
}

/** Supabase auth error in the interface language; unknown codes fall back to Supabase's own message */
function authErrorText(error: AuthError, errors: Record<string, string>): string {
  return (error.code && errors[error.code]) || error.message
}

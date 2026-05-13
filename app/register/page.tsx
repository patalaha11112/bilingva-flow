'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleRegister() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Проверь email</h1>
          <p className="text-muted-foreground">Мы отправили ссылку для подтверждения на {email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Регистрация</h1>
          <p className="text-muted-foreground mt-1">Создай аккаунт в Bilingva Flow AI</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleRegister} disabled={loading}>
            {loading ? 'Создаём...' : 'Создать аккаунт'}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="underline">Войти</Link>
        </p>
      </div>
    </div>
  )
}
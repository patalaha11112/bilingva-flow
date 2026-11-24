'use client'

import { useEffect, useRef, useState } from 'react'
import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { cacheGet, cacheKey, cacheSet } from '@/lib/client-cache'
import { getCurrentFocus, type CurrentFocus } from '@/lib/focus'

type Focus = CurrentFocus | null

/** What the user works on now: from the level test, then from each weekly review */
export function FocusCard() {
  const { user, learningLang } = useUser()
  const { t } = useT()
  const supabase = useRef(createClient()).current
  const key = cacheKey(user?.id, 'focus', learningLang)
  const [focus, setFocus] = useState<Focus | undefined>(() => cacheGet<Focus>(key))

  useEffect(() => {
    if (!user) return
    getCurrentFocus(supabase, user.id, learningLang).then((next) => {
      cacheSet(key, next)
      setFocus(next)
    })
  }, [user, learningLang, supabase, key])

  if (!focus) return null
  const ui = t.home.focus

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-4 shadow-sm space-y-3">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground">{ui.title}</h2>
        <p className="text-xs text-muted-foreground/70">{focus.source === 'test' ? ui.fromTest : ui.fromReport}</p>
      </div>
      <ul className="space-y-2.5">
        {focus.areas.map((a) => (
          <li key={a.title} className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Target className="h-3.5 w-3.5 flex-shrink-0" /> {a.title}
            </p>
            <p className="text-xs italic text-muted-foreground">{a.example}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{ui.hint}</p>
    </section>
  )
}

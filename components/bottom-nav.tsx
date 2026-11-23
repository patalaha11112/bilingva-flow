'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookA, MessageSquareText, Mic2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { t } from '@/lib/i18n'
import { getLearningLanguage } from '@/lib/languages'

const navItems = [
  { href: '/', icon: Home, key: 'home' as const },
  { href: '/alphabet', icon: BookA, key: 'alphabet' as const },
  { href: '/sentences', icon: MessageSquareText, key: 'sentences' as const },
  { href: '/practice', icon: Mic2, key: 'practice' as const },
  { href: '/video', icon: Play, key: 'video' as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const { interfaceLang: lang, learningLang } = useUser()
  const items = navItems.filter(({ href }) => href !== '/alphabet' || getLearningLanguage(learningLang).hasAlphabet)

  const hidden = ['/login', '/register'].includes(pathname)
  if (hidden) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="font-medium">{t(key, lang)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

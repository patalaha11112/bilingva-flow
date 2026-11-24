'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquareText, Repeat2, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/use-t'

const navItems = [
  { href: '/', icon: Home, key: 'home' as const },
  { href: '/sentences', icon: MessageSquareText, key: 'sentences' as const },
  { href: '/back-t', icon: Repeat2, key: 'backT' as const },
  { href: '/essay', icon: PenLine, key: 'essay' as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useT()

  const hidden = ['/login', '/register', '/welcome', '/level-test'].includes(pathname)
  if (hidden) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map(({ href, icon: Icon, key }) => {
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
              <span className="font-medium">{t.nav[key]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

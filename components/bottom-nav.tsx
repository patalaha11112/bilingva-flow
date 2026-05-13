'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookA, MessageSquareText, PenLine, Play } from 'lucide-react'
import { useApp } from '@/core'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, labelKey: 'home' as const },
  { href: '/alphabet', icon: BookA, labelKey: 'alphabet' as const },
  { href: '/sentences', icon: MessageSquareText, labelKey: 'sentences' as const },
  { href: '/writing', icon: PenLine, labelKey: 'writing' as const },
  { href: '/video', icon: Play, labelKey: 'video' as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const { translate } = useApp()

  if (pathname === '/login' || pathname === '/register') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
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
              <span className="font-medium">{translate(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

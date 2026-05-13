'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Bilingva Flow AI
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

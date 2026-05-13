'use client'

import { useApp } from '@/core'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface TabPlaceholderProps {
  icon: LucideIcon
  titleKey: 'alphabet' | 'sentences' | 'writing' | 'video'
  gradient: string
}

export function TabPlaceholder({ icon: Icon, titleKey, gradient }: TabPlaceholderProps) {
  const { translate } = useApp()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-8 text-center">
      <div className={cn('mb-6 rounded-2xl p-6', gradient)}>
        <Icon className="h-12 w-12 text-white" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">{translate(titleKey)}</h1>
      <p className="text-muted-foreground">{translate('comingSoon')}</p>
    </div>
  )
}

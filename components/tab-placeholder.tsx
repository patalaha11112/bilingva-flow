'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/hooks/use-t'
import type { Messages } from '@/locales'

interface TabPlaceholderProps {
  icon: LucideIcon
  titleKey: keyof Messages['nav']
  gradient: string
}

export function TabPlaceholder({ icon: Icon, titleKey, gradient }: TabPlaceholderProps) {
  const { t } = useT()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-8 text-center">
      <div className={cn('mb-6 rounded-2xl p-6', gradient)}>
        <Icon className="h-12 w-12 text-white" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">{t.nav[titleKey]}</h1>
      <p className="text-muted-foreground">{t.common.comingSoon}</p>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { t, type TranslationKey } from '@/lib/i18n'

interface TabPlaceholderProps {
  icon: LucideIcon
  titleKey: TranslationKey
  gradient: string
}

const soonLabel = { ru: 'Скоро', en: 'Coming soon', es: 'Próximamente' } as const

export function TabPlaceholder({ icon: Icon, titleKey, gradient }: TabPlaceholderProps) {
  const { profile } = useUser()
  const lang = profile?.interface_language ?? 'ru'

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-8 text-center">
      <div className={cn('mb-6 rounded-2xl p-6', gradient)}>
        <Icon className="h-12 w-12 text-white" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">{t(titleKey, lang)}</h1>
      <p className="text-muted-foreground">{soonLabel[lang]}</p>
    </div>
  )
}

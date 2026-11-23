'use client'

import { useUser } from '@/hooks/use-user'
import { getMessages } from '@/locales'
import { getInterfaceLanguage } from '@/lib/languages'

/**
 * UI messages in the current interface language.
 *   const { t, locale } = useT()
 *   t.settings.title
 *   plural(locale, n, t.practice.words)
 */
export function useT() {
  const { interfaceLang } = useUser()
  return {
    t: getMessages(interfaceLang),
    lang: interfaceLang,
    locale: getInterfaceLanguage(interfaceLang).locale,
  }
}

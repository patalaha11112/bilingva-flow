// ============================================
// UI messages for every interface language.
// Adding an interface language: add it to INTERFACE_LANGUAGES in
// lib/languages.ts, copy en.ts to <code>.ts, translate it and register it here
// (TypeScript reports both a missing file entry and any missing key).
// ============================================

import type { InterfaceLang } from '@/lib/languages'
import { ru, type Messages } from './ru'
import { en } from './en'
import { es } from './es'

export type { Messages }

export const MESSAGES: Record<InterfaceLang, Messages> = { ru, en, es }

export function getMessages(lang: InterfaceLang): Messages {
  return MESSAGES[lang]
}

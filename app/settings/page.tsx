'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { t } from '@/lib/i18n'
import { LEVELS, LEVEL_DESCRIPTIONS } from '@/core/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'

const INTERFACE_LANGS: { value: InterfaceLang; label: string; flag: string }[] = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
]

const LEARNING_LANGS: { value: LearningLang; flag: string; labelKey: 'lang_es' | 'lang_en' }[] = [
  { value: 'es', flag: '🇪🇸', labelKey: 'lang_es' },
  { value: 'en', flag: '🇺🇸', labelKey: 'lang_en' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { profile, activeLanguage, updateProfile, updateLevel, setActiveLanguage, isLoading } = useUser()

  const lang: InterfaceLang = profile?.interface_language ?? 'ru'
  const level: Level = activeLanguage?.level ?? 'A1'
  const learningLang: LearningLang = activeLanguage?.learning_language ?? 'es'

  const getLevelDescription = (lvl: Level) => {
    const desc = LEVEL_DESCRIPTIONS[lvl]
    if (lang === 'ru') return desc.ru
    if (lang === 'es') return desc.es
    return desc.en
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <SettingsHeader onBack={() => router.back()} title={t('settingsTitle', lang)} />
        <div className="mx-auto max-w-lg p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SettingsHeader onBack={() => router.back()} title={t('settingsTitle', lang)} />

      <main className="mx-auto max-w-lg space-y-4 p-4">

        {/* Interface Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('interfaceLanguage', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={lang}
              onValueChange={(val: InterfaceLang) => updateProfile({ interface_language: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERFACE_LANGS.map(({ value, label, flag }) => (
                  <SelectItem key={value} value={value}>
                    {flag} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Learning Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('learningLanguage', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={learningLang}
              onValueChange={(val: LearningLang) => setActiveLanguage(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEARNING_LANGS.map(({ value, flag, labelKey }) => (
                  <SelectItem key={value} value={value}>
                    {flag} {t(labelKey, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('level', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={level}
              onValueChange={(val: Level) => updateLevel(learningLang, val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map(lvl => (
                  <SelectItem key={lvl} value={lvl}>
                    {lvl} — {getLevelDescription(lvl)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* App Color (placeholder for future) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-muted-foreground text-sm">
              {t('comingSoon', lang)}: персонализация цвета
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">{t('resetProgress', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  {t('reset', lang)}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('resetConfirmTitle', lang)}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('resetConfirmMessage', lang)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      // TODO: реальный сброс — удаление всех user_sentences, user_dialog_sessions и т.д.
                      // Пока просто закрываем
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t('confirm', lang)}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}

function SettingsHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  )
}

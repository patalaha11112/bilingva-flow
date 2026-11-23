'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Sun, Moon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { LEVELS } from '@/core/constants'
import { Button } from '@/components/ui/button'
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
import { createClient } from '@/lib/supabase/client'
import {
  INTERFACE_LANGUAGES,
  INTERFACE_LANG_CODES,
  LEARNING_LANGUAGES,
  LEARNING_LANG_CODES,
} from '@/lib/languages'


export default function SettingsPage() {
  const router = useRouter()
  const { interfaceLang: lang, learningLang, level, updateProfile, updateLevel, setActiveLanguage, isLoading } = useUser()
  const { t } = useT()

  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const applyTheme = (dark: boolean) => {
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }


  if (isLoading) {
    return (
      <>
        <PageHeader title={t.settings.title} />
        <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t.settings.title} />

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">

        {/* Interface Language */}
        <section className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium">{t.settings.interfaceLanguage}</p>
          <div className="flex gap-2">
            {INTERFACE_LANG_CODES.map((value) => (
              <OptionChip
                key={value}
                selected={lang === value}
                onClick={() => updateProfile({ interface_language: value })}
              >
                <span>{INTERFACE_LANGUAGES[value].flag}</span>
                <span>{INTERFACE_LANGUAGES[value].nativeName}</span>
              </OptionChip>
            ))}
          </div>
        </section>

        {/* Learning Language */}
        <section className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium">{t.settings.learningLanguage}</p>
          <div className="flex gap-2">
            {LEARNING_LANG_CODES.map((value) => (
              <OptionChip
                key={value}
                selected={learningLang === value}
                onClick={() => setActiveLanguage(value)}
              >
                <span>{LEARNING_LANGUAGES[value].flag}</span>
                <span>{LEARNING_LANGUAGES[value].name[lang]}</span>
              </OptionChip>
            ))}
          </div>
        </section>

        {/* Level */}
        <section className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium">{t.settings.level}</p>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lvl) => (
              <LevelChip
                key={lvl}
                level={lvl}
                description={t.levels[lvl]}
                selected={level === lvl}
                onClick={() => updateLevel(learningLang, lvl)}
              />
            ))}
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-2xl bg-card shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium">{t.settings.theme}</p>
          {mounted ? (
            <div className="flex gap-2">
              <OptionChip selected={!isDark} onClick={() => applyTheme(false)}>
                <Sun className="h-4 w-4" />
                <span>{t.settings.themeLight}</span>
              </OptionChip>
              <OptionChip selected={isDark} onClick={() => applyTheme(true)}>
                <Moon className="h-4 w-4" />
                <span>{t.settings.themeDark}</span>
              </OptionChip>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="h-11 flex-1 rounded-xl bg-muted animate-pulse" />
              <div className="h-11 flex-1 rounded-xl bg-muted animate-pulse" />
            </div>
          )}
        </section>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-card shadow-sm px-4 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border/70 transition-all active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          {t.settings.logout}
        </button>

        {/* Reset progress */}
        <section className="rounded-2xl bg-card shadow-sm p-4 space-y-3 border border-destructive/25">
          <p className="text-sm font-medium text-destructive">{t.settings.resetProgress}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                {t.settings.reset}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.settings.resetConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.settings.resetConfirmMessage}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                  {t.common.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// Chip components
// ─────────────────────────────────────────────

function OptionChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-sm font-medium transition-all active:scale-[0.97]',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-foreground/75 hover:bg-accent hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function LevelChip({
  level,
  description,
  selected,
  onClick,
}: {
  level: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border py-3 px-1 transition-all active:scale-[0.97]',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background hover:bg-accent'
      )}
    >
      <span className="text-base font-bold leading-none">{level}</span>
      <span className={cn(
        'text-[10px] font-medium leading-tight text-center px-0.5',
        selected ? 'text-primary-foreground/75' : 'text-muted-foreground'
      )}>
        {description}
      </span>
    </button>
  )
}

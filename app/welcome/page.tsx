'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { useT } from '@/hooks/use-t'
import { BigOption, LevelList } from '@/components/level-list'
import {
  INTERFACE_LANGUAGES,
  INTERFACE_LANG_CODES,
  LEARNING_LANGUAGES,
  LEARNING_LANG_CODES,
} from '@/lib/languages'
import type { LearningLang, Level } from '@/types/database'

type Step = 'interface' | 'learn' | 'level'

/** First visit: your language → the language you learn → level test or a level */
export default function WelcomePage() {
  const router = useRouter()
  const { user, activeLanguage, interfaceLang, isLoading, updateProfile, setActiveLanguage, updateLevel } = useUser()
  const { t } = useT()
  const ui = t.welcome

  const [step, setStep] = useState<Step>('interface')
  const [learn, setLearn] = useState<LearningLang | null>(null)
  const [saving, setSaving] = useState(false)

  // Already set up (or signed out): nothing to do here
  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace('/login')
    else if (activeLanguage) router.replace('/')
  }, [isLoading, user, activeLanguage, router])

  if (isLoading || !user || activeLanguage) return null

  const learnOptions = LEARNING_LANG_CODES.filter((c) => c !== interfaceLang)

  const chooseLevel = async (level: Level) => {
    if (!learn) return
    setSaving(true)
    await setActiveLanguage(learn)
    await updateLevel(learn, level)
    router.replace('/')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        {step !== 'interface' && (
          <button
            onClick={() => setStep(step === 'level' ? 'learn' : 'interface')}
            aria-label={ui.back}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{ui.title}</p>
          <div className="mt-2 flex gap-1.5">
            {(['interface', 'learn', 'level'] as Step[]).map((s, i) => (
              <span key={s} className={cn(
                'h-1 flex-1 rounded-full',
                i <= ['interface', 'learn', 'level'].indexOf(step) ? 'bg-primary' : 'bg-muted'
              )} />
            ))}
          </div>
        </div>
      </div>

      {step === 'interface' && (
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{ui.interfaceTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{ui.interfaceHint}</p>
          </div>
          <div className="space-y-2">
            {INTERFACE_LANG_CODES.map((code) => (
              <BigOption
                key={code}
                selected={interfaceLang === code}
                onClick={async () => {
                  if (code !== interfaceLang) await updateProfile({ interface_language: code })
                  setStep('learn')
                }}
              >
                <span className="text-2xl">{INTERFACE_LANGUAGES[code].flag}</span>
                <span className="font-medium">{INTERFACE_LANGUAGES[code].nativeName}</span>
              </BigOption>
            ))}
          </div>
        </section>
      )}

      {step === 'learn' && (
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">{ui.learnTitle}</h1>
          <div className="space-y-2">
            {learnOptions.map((code) => (
              <BigOption
                key={code}
                selected={learn === code}
                onClick={() => { setLearn(code); setStep('level') }}
              >
                <span className="text-2xl">{LEARNING_LANGUAGES[code].flag}</span>
                <span className="font-medium">{LEARNING_LANGUAGES[code].name[interfaceLang]}</span>
              </BigOption>
            ))}
          </div>
        </section>
      )}

      {step === 'level' && learn && (
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">{ui.levelTitle}</h1>

          <button
            onClick={() => router.push(`/level-test?language=${learn}&from=welcome`)}
            disabled={saving}
            className="w-full rounded-2xl border-2 border-primary bg-primary/5 p-4 text-left transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{ui.testTitle}</p>
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    {ui.recommended}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{ui.testText}</p>
              </div>
              <ChevronRight className="mt-0.5 h-5 w-5 text-primary" />
            </div>
          </button>

          <p className="pt-2 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">{ui.orChoose}</p>

          <LevelList onChoose={chooseLevel} disabled={saving} />
        </section>
      )}
    </div>
  )
}

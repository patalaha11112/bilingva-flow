'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/core'
import { INTERESTS, LEVELS, LEVEL_DESCRIPTIONS } from '@/core/constants'
import type { InterfaceLanguage, LearningLanguage, Level, Interest } from '@/core/types'
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

export default function SettingsPage() {
  const router = useRouter()
  const { state, updateProfile, toggleInterest, resetProgress, translate } = useApp()
  const { profile } = state
  const lang = profile.interfaceLanguage

  const interfaceLanguages: { value: InterfaceLanguage; label: string; flag: string }[] = [
    { value: 'ru', label: 'Русский', flag: '🇷🇺' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
  ]

  const learningLanguages: { value: LearningLanguage; labelKey: 'spanish' | 'english'; flag: string }[] = [
    { value: 'spanish', labelKey: 'spanish', flag: '🇪🇸' },
    { value: 'english', labelKey: 'english', flag: '🇺🇸' },
  ]

  const getInterestLabel = (id: Interest) => {
    const interest = INTERESTS.find(i => i.id === id)
    if (!interest) return id
    if (lang === 'ru') return interest.labelRu
    if (lang === 'es') return interest.labelEs
    return interest.labelEn
  }

  const getLevelDescription = (level: Level) => {
    const desc = LEVEL_DESCRIPTIONS[level]
    if (lang === 'ru') return desc.ru
    if (lang === 'es') return desc.es
    return desc.en
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
          <h1 className="text-lg font-semibold">{translate('settingsTitle')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4">
        {/* Interface Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{translate('interfaceLanguage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={profile.interfaceLanguage}
              onValueChange={(value: InterfaceLanguage) => updateProfile({ interfaceLanguage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interfaceLanguages.map(({ value, label, flag }) => (
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
            <CardTitle className="text-base">{translate('learningLanguage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={profile.learningLanguage}
              onValueChange={(value: LearningLanguage) => updateProfile({ learningLanguage: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {learningLanguages.map(({ value, labelKey, flag }) => (
                  <SelectItem key={value} value={value}>
                    {flag} {translate(labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{translate('level')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={profile.level}
              onValueChange={(value: Level) => updateProfile({ level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level} — {getLevelDescription(level)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{translate('interests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => {
                const isSelected = profile.interests.includes(interest.id)
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    {getInterestLabel(interest.id)}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sentences per week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{translate('sentencesPerWeek')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={profile.sentencesPerWeek.toString()}
              onValueChange={(value) => updateProfile({ sentencesPerWeek: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 10, 14, 21].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Reset Progress */}
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive">{translate('resetProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  {translate('reset')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{translate('resetConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {translate('resetConfirmMessage')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{translate('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={resetProgress}>
                    {translate('confirm')}
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

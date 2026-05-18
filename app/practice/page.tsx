'use client'

import { Mic2 } from 'lucide-react'

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Mic2 className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      <h1 className="text-xl font-semibold">Практика</h1>
      <p className="text-sm text-muted-foreground">
        Диалоги и эссе — скоро
      </p>
    </div>
  )
}

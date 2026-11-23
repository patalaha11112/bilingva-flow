'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

/** Sticky header with a back arrow, under the main app header */
export function PageHeader({ title, fallbackHref = '/' }: { title: string; fallbackHref?: string }) {
  const router = useRouter()

  // Back to the previous page; the fallback covers direct links / reloads
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push(fallbackHref)
  }

  return (
    <header className="sticky top-14 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-12 max-w-lg items-center gap-3 px-4">
        <button
          onClick={goBack}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
    </header>
  )
}

import { cn } from '@/lib/utils'
import type { GlossChunk } from '@/types/back-translation'

/**
 * A sentence split into chunks, each with its translation written under the
 * start of the chunk (as in the printed workbook). Each chunk is a two-line
 * column, so the sentence wraps only between chunks. A long translation wraps
 * inside its own column (up to ~18ch wide) and never overlaps the next chunk.
 */
export function GlossSentence({
  chunks,
  showGloss = true,
  lang,
  glossLang,
  className,
}: {
  chunks: GlossChunk[]
  showGloss?: boolean
  /** BCP 47 code of the sentence language, for screen readers and hyphenation */
  lang?: string
  /** BCP 47 code of the translations */
  glossLang?: string
  className?: string
}) {
  return (
    <p lang={lang} className={cn('flex flex-wrap items-start gap-x-[0.4em] gap-y-2 leading-tight', className)}>
      {chunks.map((c, i) => (
        <span key={i} className="inline-flex flex-col items-start">
          <span className="text-[17px] font-semibold text-foreground">{c.text}</span>
          {showGloss && (
            <span lang={glossLang} className="mt-0.5 max-w-[18ch] text-[11px] italic leading-snug text-muted-foreground">
              {c.translation}
            </span>
          )}
        </span>
      ))}
    </p>
  )
}

import type { Level } from '@/types/database'

// Level test shapes (shared by client and server)

export interface PlacementUnderstandItem {
  id: string
  level: Level
  sentence_text: string
  /** Chunks to tap; translations are not sent before the answer */
  parts: string[]
}

export interface PlacementTranslateItem {
  id: string
  /** Band: A2 = A1–A2, B2 = B1–B2, C1 = C1–C2 */
  level: Level
  sentence_text: string
}

export interface PlacementTest {
  understand: PlacementUnderstandItem[]
  translate: PlacementTranslateItem[]
}

export interface PlacementResult {
  level: Level
  confidence: 'low' | 'medium' | 'high'
  comment: string
  strengths: { title: string; example: string }[]
  focus_areas: { title: string; why: string; example: string; prompt_hint: string }[]
  about_me: string
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_INTERFACE_LANG, INTERFACE_LANG_CODES, LEARNING_LANG_CODES } from '@/lib/languages'
import { LEVELS } from '@/core/constants'
import { isValidTimeZone } from '@/lib/server/activity'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'

// ============================================
// Request validation for API routes. Language codes come from the registry,
// so a new language is accepted here automatically.
// ============================================

const learningLang = z.enum(LEARNING_LANG_CODES as [LearningLang, ...LearningLang[]])
const interfaceLang = z.enum(INTERFACE_LANG_CODES as [InterfaceLang, ...InterfaceLang[]])
const level = z.enum(LEVELS as [Level, ...Level[]])
/** IANA time zone of the user's device, for "today"; invalid or missing → UTC */
const timeZone = z.string().max(64).refine(isValidTimeZone).catch('UTC').default('UTC')

export const SentencesBody = z.object({
  language: learningLang,
  level,
  interface_language: interfaceLang,
  topic_id: z.string().uuid().nullish().transform((v) => v ?? undefined),
  custom_topic: z.string().max(500).nullish().transform((v) => v ?? undefined),
  /** Replace the current set with a new one */
  skip: z.boolean().optional(),
  add_count: z.number().int().min(1).max(100).optional(),
  tz: timeZone,
})

export const ViewBody = z.object({
  sentence_id: z.string().uuid(),
  language: learningLang,
  tz: timeZone,
})

export const ProgressBody = z.object({
  sentence_id: z.string().uuid(),
  understood_parts: z.array(z.string().uuid()).max(50),
  language: learningLang,
  tz: timeZone,
})

export const EssayBody = z.object({
  content: z.string().trim().min(1).max(20_000),
  topic: z.string().max(500).default(''),
  language: learningLang,
  level,
  interface_language: interfaceLang,
  is_bonus: z.boolean().optional(),
  tz: timeZone,
})

export const BackTQuery = z.object({
  language: learningLang,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
  tz: timeZone,
  /** How many new sentences to offer today (the level's default up to the daily max) */
  count: z.coerce.number().int().min(1).max(10).optional(),
})

export const BackTForwardBody = z.object({
  sentence_id: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
  language: learningLang,
  interface_language: interfaceLang,
  tz: timeZone,
})

export const BackTBackBody = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(1000),
  level,
  tz: timeZone,
})

export const ReportQuery = z.object({
  language: learningLang,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
  level,
  tz: timeZone,
  /** "1": also return earlier reports */
  history: z.literal('1').optional(),
})

export const ReportAnswerBody = z.object({
  id: z.string().uuid(),
})

export const TopicQuery = z.object({
  language: learningLang,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
  tz: timeZone,
})

export const TipsQuery = z.object({
  language: learningLang,
  level,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
})

export const PlacementQuery = z.object({
  language: learningLang,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
})

export const PlacementBody = z.object({
  language: learningLang,
  interface_language: interfaceLang,
  understand: z.array(z.object({
    id: z.string().uuid(),
    understood: z.number().int().min(0).max(20),
    total: z.number().int().min(1).max(20),
  })).max(6),
  translations: z.array(z.object({
    id: z.string().uuid(),
    /** null = "I don't know" */
    text: z.string().trim().max(1000).nullable().transform((v) => v || null),
  })).max(3),
  /** null = "I can't write yet" */
  essay: z.string().trim().max(5000).nullable().transform((v) => v || null),
})

type Parsed<T> = { data: T; error: null } | { data: null; error: NextResponse }

function result<T>(parsed: z.SafeParseReturnType<unknown, T>): Parsed<T> {
  if (parsed.success) return { data: parsed.data, error: null }
  const issues = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
  return { data: null, error: NextResponse.json({ error: 'Invalid request', issues }, { status: 400 }) }
}

/** Parses a JSON body; on failure returns a ready 400 response */
export async function parseBody<T>(request: Request, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<Parsed<T>> {
  const json = await request.json().catch(() => undefined)
  return result(schema.safeParse(json))
}

/** Parses URL search params; on failure returns a ready 400 response */
export function parseQuery<T>(params: URLSearchParams, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Parsed<T> {
  return result(schema.safeParse(Object.fromEntries(params)))
}

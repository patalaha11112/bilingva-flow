import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DEFAULT_INTERFACE_LANG, INTERFACE_LANG_CODES, LEARNING_LANG_CODES } from '@/lib/languages'
import { LEVELS } from '@/core/constants'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'

// ============================================
// Request validation for API routes. Language codes come from the registry,
// so a new language is accepted here automatically.
// ============================================

const learningLang = z.enum(LEARNING_LANG_CODES as [LearningLang, ...LearningLang[]])
const interfaceLang = z.enum(INTERFACE_LANG_CODES as [InterfaceLang, ...InterfaceLang[]])
const level = z.enum(LEVELS as [Level, ...Level[]])

export const SentencesBody = z.object({
  language: learningLang,
  level,
  interface_language: interfaceLang,
  topic_id: z.string().uuid().nullish().transform((v) => v ?? undefined),
  custom_topic: z.string().max(500).nullish().transform((v) => v ?? undefined),
  refresh: z.boolean().optional(),
  add_count: z.number().int().min(1).max(100).optional(),
})

export const ProgressBody = z.object({
  sentence_id: z.string().uuid(),
  understood_parts: z.array(z.string().uuid()).max(50),
  language: learningLang,
})

export const EssayBody = z.object({
  content: z.string().trim().min(1).max(20_000),
  topic: z.string().max(500).default(''),
  language: learningLang,
  level,
  interface_language: interfaceLang,
  is_bonus: z.boolean().optional(),
})

export const TopicQuery = z.object({
  language: learningLang,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
})

export const TipsQuery = z.object({
  language: learningLang,
  level,
  interface_lang: interfaceLang.catch(DEFAULT_INTERFACE_LANG),
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

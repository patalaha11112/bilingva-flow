import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_MODELS, generateJson } from '@/lib/server/ai'
import { PLACEMENT_ITEMS_SCHEMA, PLACEMENT_SCHEMA, placementItemsPrompt, placementPrompt } from '@/lib/server/prompts'
import { LEVELS } from '@/core/constants'
import type { InterfaceLang, LearningLang, Level } from '@/types/database'
import type { PlacementResult, PlacementTest } from '@/types/placement'

// ============================================
// Level test. The sentence bank (placement_items) is shared content, built by
// the AI once per language pair and kept; reference translations never leave
// the server. Results are written with the service role.
// ============================================

export const TRANSLATE_BANDS: Level[] = ['A2', 'B2', 'C1']
const VARIANTS = 2

type ItemRow = {
  id: string
  kind: 'understand' | 'translate'
  level: Level
  variant: number
  sentence_text: string
  translation: string
  parts: { text: string; translation: string }[]
}

const ITEM_FIELDS = 'id, kind, level, variant, sentence_text, translation, parts'

async function loadItems(language: LearningLang, interfaceLanguage: InterfaceLang): Promise<ItemRow[]> {
  const { data } = await createAdminClient()
    .from('placement_items')
    .select(ITEM_FIELDS)
    .eq('language', language)
    .eq('interface_language', interfaceLanguage)
  return (data ?? []) as ItemRow[]
}

function isComplete(items: ItemRow[]) {
  const has = (kind: string, level: Level, variant: number) =>
    items.some((i) => i.kind === kind && i.level === level && i.variant === variant)
  for (let v = 0; v < VARIANTS; v++) {
    if (!LEVELS.every((l) => has('understand', l, v))) return false
    if (!TRANSLATE_BANDS.every((l) => has('translate', l, v))) return false
  }
  return true
}

/** The bank for a language pair; built by the AI on first use */
async function ensureItems(language: LearningLang, interfaceLanguage: InterfaceLang): Promise<ItemRow[]> {
  const existing = await loadItems(language, interfaceLanguage)
  if (isComplete(existing)) return existing

  const generated = await generateJson<Omit<ItemRow, 'id'>[]>(
    AI_MODELS.placementItems,
    placementItemsPrompt({ language, interfaceLanguage }),
    PLACEMENT_ITEMS_SCHEMA
  )
  const rows = generated
    .filter((g) => g.sentence_text?.trim() && g.translation?.trim() && g.variant >= 0 && g.variant < VARIANTS)
    .filter((g) => g.kind === 'understand' ? g.parts?.length > 0 : TRANSLATE_BANDS.includes(g.level))
    .map((g) => ({
      language,
      interface_language: interfaceLanguage,
      kind: g.kind,
      level: g.level,
      variant: g.variant,
      sentence_text: g.sentence_text.trim(),
      translation: g.translation.trim(),
      parts: g.kind === 'understand' ? g.parts.filter((p) => p.text?.trim()) : [],
    }))
  // Keep what is already there (another request may have built it in parallel)
  await createAdminClient()
    .from('placement_items')
    .upsert(rows, { onConflict: 'language,interface_language,kind,level,variant', ignoreDuplicates: true })

  return loadItems(language, interfaceLanguage)
}

/** Test for the user; a retake gets the other variant */
export async function getPlacementTest(
  supabase: SupabaseClient,
  opts: { userId: string; language: LearningLang; interfaceLanguage: InterfaceLang }
): Promise<PlacementTest> {
  const items = await ensureItems(opts.language, opts.interfaceLanguage)
  const { count } = await supabase
    .from('placement_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', opts.userId)
    .eq('language', opts.language)
  const variant = (count ?? 0) % VARIANTS
  const pick = (kind: ItemRow['kind'], level: Level) =>
    items.find((i) => i.kind === kind && i.level === level && i.variant === variant)
    ?? items.find((i) => i.kind === kind && i.level === level)

  return {
    understand: LEVELS.map((l) => pick('understand', l)).filter((i): i is ItemRow => !!i)
      .map((i) => ({ id: i.id, level: i.level, sentence_text: i.sentence_text, parts: i.parts.map((p) => p.text) })),
    translate: TRANSLATE_BANDS.map((l) => pick('translate', l)).filter((i): i is ItemRow => !!i)
      .map((i) => ({ id: i.id, level: i.level, sentence_text: i.sentence_text })),
  }
}

/** Grades a finished test, keeps the result and the revised "about me" */
export async function gradePlacement(
  supabase: SupabaseClient,
  opts: {
    userId: string
    language: LearningLang
    interfaceLanguage: InterfaceLang
    understand: { id: string; understood: number; total: number }[]
    translations: { id: string; text: string | null }[]
    essay: string | null
  }
): Promise<PlacementResult> {
  const { userId, language, interfaceLanguage } = opts
  const ids = [...opts.understand.map((u) => u.id), ...opts.translations.map((t) => t.id)]
  const { data: itemRows } = await createAdminClient()
    .from('placement_items')
    .select(ITEM_FIELDS)
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  const items = new Map(((itemRows ?? []) as ItemRow[]).map((i) => [i.id, i]))

  const { data: profile } = await supabase.from('user_profiles').select('about_me').eq('id', userId).maybeSingle()
  const aboutMe = (profile?.about_me as string | null)?.trim() || null

  const result = await generateJson<PlacementResult>(
    AI_MODELS.placement,
    placementPrompt({
      language,
      interfaceLanguage,
      understanding: opts.understand.flatMap((u) => {
        const item = items.get(u.id)
        return item ? [{ level: item.level, sentence: item.sentence_text, understood: u.total ? u.understood / u.total : 0 }] : []
      }),
      translations: opts.translations.flatMap((t) => {
        const item = items.get(t.id)
        return item ? [{ band: item.level, sentence: item.sentence_text, reference: item.translation, attempt: t.text }] : []
      }),
      essay: opts.essay,
      aboutMe,
    }),
    PLACEMENT_SCHEMA
  )

  const about = result.about_me?.trim().slice(0, 2000) || aboutMe || ''
  const final: PlacementResult = { ...result, about_me: about }

  const admin = createAdminClient()
  await admin.from('placement_results').insert({
    user_id: userId,
    language,
    interface_language: interfaceLanguage,
    level_estimate: final.level,
    result: final,
  })
  if (about && about !== aboutMe) {
    await admin.from('user_profiles').update({ about_me: about }).eq('id', userId)
  }
  return final
}

/** Tests taken in the last 24 hours (AI limit) */
export async function placementsLastDay(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from('placement_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
  return count ?? 0
}

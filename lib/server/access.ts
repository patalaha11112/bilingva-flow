import { createAdminClient } from '@/lib/supabase/admin'

// ============================================
// Limits on AI usage for regular users. Admins (rows in public.app_admins)
// have no limits. The table is readable only with the service-role key, so a
// user can't grant themselves admin.
// ============================================

export const LIMITS = {
  /** New sentences per learning language in 24 hours (new sets + "add one" + skips) */
  sentencesPerDay: 20,
  /** Essays graded per day */
  essaysPerDay: 20,
  /** Max essay length sent to the AI */
  essayMaxChars: 4000,
  /** Max length of a custom topic (admins only) */
  customTopicMaxChars: 80,
} as const

export async function isAppAdmin(userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from('app_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[access] admin check failed:', error.message)
    return false
  }
  return !!data
}

/** Strips characters that could break out of a quoted prompt value */
export function sanitizePromptText(text: string, maxChars: number): string {
  return text.replace(/["`\\\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxChars)
}

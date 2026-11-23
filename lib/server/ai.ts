import { GoogleGenAI, ThinkingLevel } from '@google/genai'

// ============================================
// Gemini access for all AI tasks.
//
// Each task has a primary model and a fallback, used when the primary is
// overloaded (503), out of quota (429) or too slow. The primary can be
// overridden with env vars (e.g. in Vercel) to try another model without a
// code change.
//
// Chosen 2026-11-23 by running the real sentence prompt on every model the
// API key can use: gemini-4-hydrogen gave correct Cyrillic pronunciation,
// relevant tips and accurate grammar notes; gemini-2.5-flash-lite is faster but
// makes stress and transcription mistakes. gemini-4-argon/carbon/neon are not
// available on the current (free) tier.
// ============================================

const FALLBACK_MODEL = 'gemini-2.5-flash-lite'

export const AI_MODELS = {
  sentences: process.env.GEMINI_MODEL_SENTENCES || 'gemini-4-hydrogen',
  essay: process.env.GEMINI_MODEL_ESSAY || 'gemini-4-hydrogen',
  backTranslation: process.env.GEMINI_MODEL_BACK_TRANSLATION || 'gemini-4-hydrogen',
  // Once per set; flash-lite mistranslated words here, so the better model is worth it
  essayTopic: process.env.GEMINI_MODEL_ESSAY_TOPIC || 'gemini-4-hydrogen',
  weeklyReport: process.env.GEMINI_MODEL_WEEKLY_REPORT || 'gemini-4-hydrogen',
} as const

const TIMEOUT_MS = 60_000

let client: GoogleGenAI | null = null
// JSON mode (responseJsonSchema) is only available on v1beta
const ai = () => (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: 'v1beta' }))

async function callModel(model: string, prompt: string, schema: object): Promise<string> {
  const res = await ai().models.generateContent({
    model,
    contents: prompt,
    config: {
      // httpOptions.timeout is not enforced by the SDK; an abort signal is
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      // Short structured tasks: deep reasoning only adds latency and cost.
      // Gemini 2.x models don't accept thinkingLevel.
      ...(model.startsWith('gemini-2.') ? {} : { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }),
    },
  })
  return res.text ?? ''
}

/** Runs a prompt and returns the JSON response, shaped by `schema`; falls back to a lighter model on failure */
const isOverloaded = (err: unknown) => /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(String(err instanceof Error ? err.message : err))

export async function generateJson<T>(
  model: string,
  prompt: string,
  schema: object,
  /** false: fail instead of using the lighter model (for tasks where quality matters more than speed) */
  { fallback = true }: { fallback?: boolean } = {}
): Promise<T> {
  try {
    return JSON.parse(await callModel(model, prompt, schema)) as T
  } catch (err) {
    // Overload spikes are usually brief: one retry of the primary before falling back
    if (isOverloaded(err)) {
      await new Promise((r) => setTimeout(r, 2_000))
      try {
        return JSON.parse(await callModel(model, prompt, schema)) as T
      } catch (retryErr) {
        err = retryErr
      }
    }
    if (!fallback || model === FALLBACK_MODEL) throw err
    console.error(`[ai] ${model} failed, falling back to ${FALLBACK_MODEL}:`, err instanceof Error ? err.message : err)
    return JSON.parse(await callModel(FALLBACK_MODEL, prompt, schema)) as T
  }
}

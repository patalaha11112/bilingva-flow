// Compares Gemini models on the real sentence prompt: latency, JSON validity, tokens.
// Usage: pnpm bench:ai gemini-4-hydrogen gemini-2.5-flash-lite
// Writes the generated sentences to bench-ai.json for a quality check.
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { writeFileSync } from 'node:fs'
import { sentencesPrompt, SENTENCES_SCHEMA } from '@/lib/server/prompts'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: 'v1beta' })
const prompt = sentencesPrompt({ language: 'es', level: 'A2', topicName: '', interfaceLanguage: 'ru', count: 5 })
const models = process.argv.slice(2)
const out: Record<string, unknown> = {}
await Promise.all(models.map(async (model) => {
  const t0 = Date.now()
  try {
    const call = (thinking: boolean) => ai.models.generateContent({
      model, contents: prompt,
      config: { abortSignal: AbortSignal.timeout(90_000), responseMimeType: 'application/json', responseJsonSchema: SENTENCES_SCHEMA,
        ...(thinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}) },
    })
    let res, note = ''
    try { res = await call(true) } catch (e: any) { note = 'no-thinkingLevel; '; res = await call(false) }
    const data = JSON.parse(res.text ?? '')
    const u = res.usageMetadata
    out[model] = data
    writeFileSync(process.env.OUT ?? 'bench-ai.json', JSON.stringify(out, null, 1))
    console.log(`${model.padEnd(24)} ${((Date.now() - t0) / 1000).toFixed(1)}s  sentences=${data.length} parts=${data.map((s: any) => s.parts.length).join('/')}  in=${u?.promptTokenCount} out=${u?.candidatesTokenCount} thoughts=${u?.thoughtsTokenCount ?? 0} ${note}`)
  } catch (e: any) {
    console.log(`${model.padEnd(24)} FAIL ${((Date.now() - t0) / 1000).toFixed(1)}s ${String(e?.message ?? e).slice(0, 160)}`)
  }
}))
writeFileSync(process.env.OUT ?? 'bench-ai.json', JSON.stringify(out, null, 1))

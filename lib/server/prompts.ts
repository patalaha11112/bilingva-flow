import { getInterfaceLanguage, getLearningLanguage, type InterfaceLang, type LearningLang } from '@/lib/languages'
import type { Level } from '@/types/database'

// ============================================
// Prompts and response schemas for the AI tasks.
// Responses use structured output (JSON schema), so the model can only
// return valid JSON of this shape.
// ============================================

export function sentencesPrompt({
  language,
  level,
  topicName,
  interfaceLanguage,
  count,
  focus = [],
}: {
  language: LearningLang
  level: Level
  topicName: string
  interfaceLanguage: InterfaceLang
  count: number
  /** Patterns from the latest weekly report to practise */
  focus?: string[]
}): string {
  const learning = getLearningLanguage(language).prompt
  const langName = learning.name
  const uiLang = getInterfaceLanguage(interfaceLanguage).promptName
  const explanationRules = learning.explanationRules
    .map((rule) => `- ${rule.replaceAll('{ui}', uiLang)}`)
    .join('\n')
  const topic = topicName || 'general everyday life'

  return `You are an expert language teacher creating structured learning materials.

Generate exactly ${count} ${langName} sentence${count > 1 ? "s" : ""} for a student at level ${level}.
Topic: "${topic}"
${count > 1 ? `
## Story Rules
These ${count} sentences must form a connected mini-story about the topic.
- They should flow naturally one into the next (beginning → middle → end)
- Use consistent characters, places, or objects across sentences
- Together they should describe one real-life situation from start to finish
- The story should feel natural, not forced — like something that actually happens
` : ""}
## Sentence Rules
- Match level ${level} exactly in vocabulary and grammar complexity
- Sentences must be natural and useful in real life situations
- Vary sentence structures (statements, questions, negations — mix them)
- Prefer practical, everyday vocabulary over abstract or literary words
- Each sentence must cover a different grammar pattern or vocabulary area

${focus.length ? `## Focus
The student is working on: ${focus.join('; ')}.
Naturally include these patterns in at least half of the sentences, without making them feel forced.

` : ''}## Splitting Rules
Split each sentence into 2–5 parts by grammatical units:
- subject or subject phrase
- verb phrase (verb + auxiliary if any)
- object or complement
- adverbial (time, place, manner)
Do NOT split single words unless the word itself is the entire meaningful unit.

## Pronunciation Rules
- Write pronunciation as it sounds to a native ${uiLang} speaker
- Mark stress with CAPITAL letter on the stressed syllable
- Example: ${learning.pronunciationExample}
- Avoid English-based approximations — use only sounds natural in ${uiLang}

## Explanation Rules
For each part write a short, encouraging explanation in ${uiLang} (1–2 sentences max):
${explanationRules}
- Do NOT state obvious things if the translation already says so

## Tip Rules
Add a "tip" field ONLY for: irregular forms, false friends, or tricky pronunciation.
Omit "tip" entirely when there is nothing non-obvious to say.

## Output Format
Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

[
  {
    "sentence_text": "full sentence in ${langName}",
    "translation": "translation in ${uiLang}",
    "parts": [
      {
        "text": "part of sentence",
        "translation": "translation of this part in ${uiLang}",
        "pronunciation": "stress marked with CAPITAL letters",
        "explanation": "grammar note in ${uiLang}",
        "tip": "only if non-obvious — omit otherwise"
      }
    ]
  }
]`
}

const part = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    translation: { type: 'string' },
    pronunciation: { type: 'string' },
    explanation: { type: 'string' },
    tip: { type: 'string' },
  },
  required: ['text', 'translation', 'pronunciation', 'explanation'],
}

export const SENTENCES_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      sentence_text: { type: 'string' },
      translation: { type: 'string' },
      parts: { type: 'array', items: part },
    },
    required: ['sentence_text', 'translation', 'parts'],
  },
}

export function essayPrompt({
  language,
  interfaceLanguage,
  level,
  topic,
  content,
}: {
  language: LearningLang
  interfaceLanguage: InterfaceLang
  level: Level
  /** Already sanitized */
  topic: string
  content: string
}): string {
  const langName = getLearningLanguage(language).prompt.name
  const uiLang = getInterfaceLanguage(interfaceLanguage).promptName

  return `You are an encouraging language teacher reviewing a student's essay written in ${langName}.

Student level: ${level}
Essay topic: "${topic}"
Respond in: ${uiLang}

Essay:
"""
${content}
"""

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "score": <integer 1-10>,
  "feedback": "<1-2 sentences of specific genuine praise about something concrete in this text>",
  "improvements": [
    {
      "original": "<exact phrase from the essay>",
      "better": "<corrected or improved version in ${langName}>",
      "why": "<1 sentence explanation in ${uiLang}>"
    }
  ],
  "alternatives": [
    {
      "phrase": "<phrase the student used>",
      "options": ["<richer alternative in ${langName}>", "<another alternative>"]
    }
  ],
  "fun_fact": "<one genuinely interesting or surprising fact about this topic or about ${langName}, in ${uiLang}>",
  "words_used": ["list", "of", "${langName}", "words", "detected", "in", "the", "essay"]
}

Rules:
- improvements: 1–3 items, only for real grammar or vocabulary mistakes. Empty array if no mistakes.
- alternatives: 1–2 items showing richer ways to express what the student already wrote.
- fun_fact: always include. Make it specific and engaging, not generic.`
}

export const ESSAY_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10 },
    feedback: { type: 'string' },
    improvements: {
      type: 'array',
      items: {
        type: 'object',
        properties: { original: { type: 'string' }, better: { type: 'string' }, why: { type: 'string' } },
        required: ['original', 'better', 'why'],
      },
    },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: { phrase: { type: 'string' }, options: { type: 'array', items: { type: 'string' } } },
        required: ['phrase', 'options'],
      },
    },
    fun_fact: { type: 'string' },
    words_used: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'feedback', 'improvements', 'alternatives', 'fun_fact', 'words_used'],
}

export function backTranslationPrompt({
  language,
  interfaceLanguage,
  level,
  original,
  forward,
  attempt,
}: {
  language: LearningLang
  interfaceLanguage: InterfaceLang
  level: Level
  /** Original sentence in the learning language */
  original: string
  /** The student's translation into the interface language (sanitized) */
  forward: string
  /** The student's translation of `forward` back into the learning language (sanitized) */
  attempt: string
}): string {
  const langName = getLearningLanguage(language).prompt.name
  const uiLang = getInterfaceLanguage(interfaceLanguage).promptName

  return `You are a friendly, precise ${langName} teacher. A student at level ${level}, whose native language is ${uiLang}, did a back-translation exercise:

1. Original ${langName} sentence: "${original}"
2. The student translated it into ${uiLang}: "${forward}"
3. A day later, without seeing the original, the student translated their own ${uiLang} text back into ${langName}: "${attempt}"

Compare the attempt (3) with the original (1) and help the student learn from the differences. Write all explanations in ${uiLang}.

Rules:
- A different wording that is correct, natural and keeps the meaning is NOT a mistake. Mention how the original says it as an alternative, and keep the score high.
- corrections: only real errors (grammar, vocabulary, word order, gender/agreement, accents and other spelling) or places where the meaning drifted. 0–4 items. "yours" is the exact fragment from the attempt, "better" is how the original says it, "why" is one short sentence.
- If the student's translation in step 2 already changed the meaning, say so in one of the tips.
- tips: 1–2 short, practical tips about the patterns in this sentence that are worth remembering.
- praise: one sentence of specific, genuine praise about the attempt.
- score: 10 = identical or equally correct; 7–9 = small slips; 4–6 = meaning kept but several errors; 1–3 = meaning lost.
- verdict: "exact" (same as the original, ignoring punctuation), "close" (correct or nearly correct, different wording or small slips), "different" (meaning changed or many errors).`
}

export const BACK_TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 1, maximum: 10 },
    verdict: { type: 'string', enum: ['exact', 'close', 'different'] },
    praise: { type: 'string' },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: { yours: { type: 'string' }, better: { type: 'string' }, why: { type: 'string' } },
        required: ['yours', 'better', 'why'],
      },
    },
    tips: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'verdict', 'praise', 'corrections', 'tips'],
}

export function essayTopicPrompt({
  language,
  interfaceLanguage,
  level,
  sentences,
  focus = [],
  aboutMe,
}: {
  language: LearningLang
  interfaceLanguage: InterfaceLang
  level: Level
  /** The set's sentences with their translations */
  sentences: { text: string; translation: string }[]
  /** Patterns from the latest weekly report to practise */
  focus?: string[]
  /** The student's own "about me" text (already sanitized) */
  aboutMe?: string
}): string {
  const langName = getLearningLanguage(language).prompt.name
  const uiLang = getInterfaceLanguage(interfaceLanguage).promptName
  const list = sentences.map((s, i) => `${i + 1}. ${s.text} — ${s.translation}`).join('\n')

  return `A student at level ${level} (native language: ${uiLang}) has just studied these ${langName} sentences:

${list}

Create a short essay assignment so the student practises exactly this material:
- topic: one engaging essay topic in ${uiLang}, connected to the situation of these sentences but asking the student to write about their own life or opinion (max 12 words). No quotes.
${focus.length ? `- The student is also working on: ${focus.join('; ')}. Choose a topic that naturally needs these patterns.
` : ''}${aboutMe ? `- About the student (from their own words): "${aboutMe}". Make the topic personal and relevant to their life when it fits naturally.
` : ''}- words: 6–8 useful words or short phrases taken from the sentences above, in ${langName} exactly as they appear (verbs may be given in the form used), each with a translation into ${uiLang}. Prefer the most useful vocabulary and patterns; skip names and trivial words.`
}

export const ESSAY_TOPIC_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    words: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, translation: { type: 'string' } },
        required: ['text', 'translation'],
      },
    },
  },
  required: ['topic', 'words'],
}

export interface WeeklyReportInput {
  language: LearningLang
  interfaceLanguage: InterfaceLang
  levelSet: Level
  stats: Record<string, number | null>
  backTranslations: { original: string; attempt: string; score: number; corrections: { yours: string; better: string; why: string }[] }[]
  essays: { topic: string; excerpt: string; score: number | null; improvements: { original: string; better: string; why: string }[] }[]
  previousFocus: string[]
}

export function weeklyReportPrompt(input: WeeklyReportInput): string {
  const langName = getLearningLanguage(input.language).prompt.name
  const uiLang = getInterfaceLanguage(input.interfaceLanguage).promptName

  const backT = input.backTranslations
    .map((b, i) => `${i + 1}. STUDENT WROTE: "${b.attempt}" | score ${b.score}/10 | ` +
      (b.corrections.length
        ? `mistakes: ${b.corrections.map((c) => `"${c.yours}" should be "${c.better}" (${c.why})`).join('; ')}`
        : 'no mistakes') +
      ` | (reference only, do not cite: "${b.original}")`)
    .join('\n') || '(none)'
  const essays = input.essays
    .map((e, i) => `${i + 1}. topic: "${e.topic}" | score ${e.score ?? '?'}/10 | STUDENT WROTE: "${e.excerpt}"` +
      (e.improvements.length ? ` | mistakes: ${e.improvements.map((c) => `"${c.original}" should be "${c.better}" (${c.why})`).join('; ')}` : ' | no mistakes found'))
    .join('\n') || '(none)'

  return `You are a warm, encouraging and precise ${langName} teacher writing a weekly progress report for your student.
The student's native language is ${uiLang}; the level chosen in the app is ${input.levelSet}.
IMPORTANT: write every text field in ${uiLang}. Only the examples are in ${langName}.

## This week's numbers
${Object.entries(input.stats).map(([k, v]) => `- ${k}: ${v ?? '—'}`).join('\n')}

## Back-translations
"original" is the model sentence; "student" is what the student wrote from memory. Judge the student only by what THEY wrote.
${backT}

## Essays (written in ${langName})
${essays}

## Focus areas from last week
${input.previousFocus.length ? input.previousFocus.map((f) => `- ${f}`).join('\n') : '(none — this is the first report)'}

Write the report in ${uiLang} (except examples, which are in ${langName}).

Rules:
- Tone: positive and motivating. Present weaknesses as "next steps", never as failures. Be specific, not generic.
- Base everything ONLY on the evidence above.
- strengths and known: only things the student got RIGHT in what THEY wrote. Never cite a reference sentence, never cite a phrase listed under mistakes, and never list as "known" a pattern the student got wrong this week.
- In strengths, the example is a correct phrase the student wrote.
- level_estimate: the CEFR level the evidence shows. With little evidence, stay close to the chosen level and set confidence "low".
- level_comment: 1–2 sentences explaining the estimate in friendly terms.
- headline: one short, upbeat sentence summarising the week.
- strengths: 2–3 things that went well, each with a short example from the student's work.
- known: 3–6 short items the student clearly already handles (grammar patterns, vocabulary areas).
- focus_areas: 2–3 most useful things to work on next week, based on recurring corrections. For each: title (short), why (one sentence, encouraging), example (a correct ${langName} example), prompt_hint (in English, a short description of the grammar/vocabulary pattern for generating practice material, e.g. "written accents on past-tense verbs (quería, también)").
- If last week's focus areas improved, mention it in strengths or the encouragement.
- encouragement: 1–2 sentences to motivate the coming week.

Remember: all text in ${uiLang}.`
}

export const WEEKLY_REPORT_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    level_estimate: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    level_comment: { type: 'string' },
    strengths: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, example: { type: 'string' } },
        required: ['title', 'example'],
      },
    },
    known: { type: 'array', items: { type: 'string' } },
    focus_areas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          why: { type: 'string' },
          example: { type: 'string' },
          prompt_hint: { type: 'string' },
        },
        required: ['title', 'why', 'example', 'prompt_hint'],
      },
    },
    encouragement: { type: 'string' },
  },
  required: ['headline', 'level_estimate', 'confidence', 'level_comment', 'strengths', 'known', 'focus_areas', 'encouragement'],
}

// ─────────────────────────────────────────────
// Level test (placement)
// ─────────────────────────────────────────────

export function placementItemsPrompt({
  language,
  interfaceLanguage,
}: {
  language: LearningLang
  interfaceLanguage: InterfaceLang
}): string {
  const langName = getLearningLanguage(language).prompt.name
  const uiLang = getInterfaceLanguage(interfaceLanguage).promptName

  return `You are an experienced ${langName} examiner (CEFR). Create sentences for a short placement test for a learner whose native language is ${uiLang}.

1. "understand": 12 sentences — exactly 2 for each level A1, A2, B1, B2, C1, C2 (variant 0 and 1).
   - Each sentence must be clearly and typically at its level: vocabulary, grammar and length grow with the level
     (A1: 4–7 very common words, present tense; C2: idiomatic, nuanced, complex syntax).
   - Everyday, neutral topics (no names of real people, no politics).
   - Split each into 2–5 meaningful chunks (subject, verb phrase, object, adverbial…); chunks joined with spaces give the sentence.
   - Give each chunk and the whole sentence a natural translation into ${uiLang}.

2. "translate": 6 sentences — exactly 2 for each band: "A2" (A1–A2), "B2" (B1–B2), "C1" (C1–C2), variants 0 and 1.
   - Different from the "understand" sentences. One sentence each, typical of the band.
   - Give a natural reference translation into ${uiLang}; parts must be an empty array.

All sentence_text in ${langName}; all translations in ${uiLang}.`
}

export const PLACEMENT_ITEMS_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['understand', 'translate'] },
      level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
      variant: { type: 'integer', enum: [0, 1] },
      sentence_text: { type: 'string' },
      translation: { type: 'string' },
      parts: {
        type: 'array',
        items: {
          type: 'object',
          properties: { text: { type: 'string' }, translation: { type: 'string' } },
          required: ['text', 'translation'],
        },
      },
    },
    required: ['kind', 'level', 'variant', 'sentence_text', 'translation', 'parts'],
  },
}

export interface PlacementInput {
  language: LearningLang
  interfaceLanguage: InterfaceLang
  /** Self-reported understanding per level (0–1); levels not shown are omitted */
  understanding: { level: Level; sentence: string; understood: number }[]
  /** null text = "I don't know" */
  translations: { band: string; sentence: string; reference: string; attempt: string | null }[]
  /** null = "I can't write yet" */
  essay: string | null
  /** The current "about me" text, to revise */
  aboutMe: string | null
}

export function placementPrompt(input: PlacementInput): string {
  const langName = getLearningLanguage(input.language).prompt.name
  const uiLang = getInterfaceLanguage(input.interfaceLanguage).promptName

  const understanding = input.understanding
    .map((u) => `- ${u.level}: "${u.sentence}" — student says they understood ${Math.round(u.understood * 100)}%`)
    .join('\n') || '(skipped)'
  const translations = input.translations
    .map((t, i) => `${i + 1}. [${t.band}] "${t.sentence}" | reference (${uiLang}): "${t.reference}" | STUDENT: ${t.attempt ? `"${t.attempt}"` : "(said: I don't know)"}`)
    .join('\n') || '(none)'

  return `You are a warm, precise ${langName} examiner placing a new student on the CEFR scale. The student's native language is ${uiLang}.
IMPORTANT: write every text field in ${uiLang}. Only examples are in ${langName}.

## Step 1 — understanding (self-assessment, the student tapped the parts they understood)
${understanding}

## Step 2 — translation from ${langName} into ${uiLang} (checks real understanding)
${translations}

## Step 3 — essay "about me" written in ${langName}
${input.essay ? `"${input.essay}"` : '(the student said they cannot write yet)'}

## How to decide
- Self-assessment is the weakest evidence; translations show real comprehension; the essay shows active skills.
- Learners usually understand more than they can write: place them at the level they can actually use — mostly what the essay shows, raised by up to one level when translations prove clearly higher comprehension.
- No essay and weak translations → A1. Never place above what at least two steps support.
- confidence: "high" when the three steps agree, "low" when there is little evidence or they disagree.

## Output
- level: the CEFR level.
- comment: 2–3 friendly sentences explaining the result (refer to what the student did).
- strengths: 1–3 things the student already does well, each with a short example of the student's own correct text or an understood sentence. Empty if there is nothing.
- focus_areas: 2–3 most useful next steps. For each: title (short), why (one encouraging sentence), example (a correct ${langName} example), prompt_hint (in English, a short description of the pattern for generating practice material).
- about_me: a short profile of the student in ${uiLang}, written in the first person, 1–6 short sentences (max 600 characters): name, where they live and are from, work or study, family, hobbies, languages, why they learn — only what they actually said.
  ${input.aboutMe ? `The current profile is below. Revise it: keep everything still true (the student may have edited it themselves), update what changed, add new facts. Never drop facts just because this essay doesn't mention them.
  Current profile: "${input.aboutMe}"` : 'There is no profile yet.'}
  ${input.essay ? '' : 'There is no essay: return the current profile unchanged (or an empty string).'}

Remember: all text in ${uiLang}.`
}

export const PLACEMENT_SCHEMA = {
  type: 'object',
  properties: {
    level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    comment: { type: 'string' },
    strengths: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, example: { type: 'string' } },
        required: ['title', 'example'],
      },
    },
    focus_areas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          why: { type: 'string' },
          example: { type: 'string' },
          prompt_hint: { type: 'string' },
        },
        required: ['title', 'why', 'example', 'prompt_hint'],
      },
    },
    about_me: { type: 'string' },
  },
  required: ['level', 'confidence', 'comment', 'strengths', 'focus_areas', 'about_me'],
}

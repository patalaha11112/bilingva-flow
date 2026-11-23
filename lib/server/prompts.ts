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
}: {
  language: LearningLang
  level: Level
  topicName: string
  interfaceLanguage: InterfaceLang
  count: number
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

## Splitting Rules
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

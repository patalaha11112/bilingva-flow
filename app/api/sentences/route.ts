import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  LearningLang,
  Level,
  InterfaceLang,
  GeneratedSentence,
} from "@/types/database";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Получить номер ISO-недели
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { language, level, topic_id, custom_topic, interface_language, refresh } =
      (await request.json()) as {
        language: LearningLang;
        level: Level;
        topic_id?: string;
        custom_topic?: string;
        interface_language: InterfaceLang;
        refresh?: boolean;
      };

    const { week: currentWeek, year: currentYear } = getISOWeek(new Date());

    // ─────────────────────────────────────────
    // 1. Get active sentences for this week
    // ─────────────────────────────────────────
    if (!refresh) {
      const { data: activeSentences } = await supabase
        .from("user_sentences")
        .select("sentence_id")
        .eq("user_id", user.id)
        .eq("language", language)
        .eq("week_number", currentWeek)
        .eq("year", currentYear)
        .eq("is_active", true);

      const activeSentenceIds = (activeSentences ?? []).map((r) => r.sentence_id);

      // If we have 5 active sentences, return them
      if (activeSentenceIds.length >= 5) {
        const { data: sentencesData } = await supabase
          .from("sentences")
          .select(
            "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, language, sentence_parts(*)"
          )
          .in("id", activeSentenceIds.slice(0, 5));

        return NextResponse.json({
          sentences: sentencesData ?? [],
          generated: false,
          weeklyLimit: {
            total: activeSentences.length,
            max: 10,
          },
        });
      }

      // If we have less than 5, load them and fill up to 5
      let existingSentences: any[] = [];
      if (activeSentenceIds.length > 0) {
        const { data } = await supabase
          .from("sentences")
          .select(
            "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, language, sentence_parts(*)"
          )
          .in("id", activeSentenceIds);
        existingSentences = data ?? [];
      }

      const needed = 5 - existingSentences.length;

      // Get new sentences
      const newSentences = await getNewSentences(
        supabase,
        supabaseAdmin,
        user.id,
        language,
        level,
        topic_id,
        custom_topic,
        interface_language,
        needed
      );

      // Save new sentences to user_sentences with current week info
      for (const s of newSentences) {
        await supabaseAdmin.from("user_sentences").insert({
          user_id: user.id,
          sentence_id: s.id,
          language,
          understood_parts: [],
          all_understood: false,
          times_shown: 0,
          last_shown_at: null,
          fully_mastered: false,
          first_seen_at: new Date().toISOString(),
          is_active: true,
          week_number: currentWeek,
          year: currentYear,
        });
      }

      const totalSentences = [...existingSentences, ...newSentences];
      return NextResponse.json({
        sentences: totalSentences,
        generated: newSentences.length > 0,
        weeklyLimit: {
          total: activeSentenceIds.length + newSentences.length,
          max: 10,
        },
      });
    }

    // ─────────────────────────────────────────
    // 2. REFRESH: Deactivate old, get 5 new
    // ─────────────────────────────────────────
    if (refresh) {
      // Check total active count before refresh
      const { data: currentActive } = await supabase
        .from("user_sentences")
        .select("id")
        .eq("user_id", user.id)
        .eq("language", language)
        .eq("week_number", currentWeek)
        .eq("year", currentYear)
        .eq("is_active", true);

      // Deactivate all current active sentences
      if (currentActive && currentActive.length > 0) {
        const currentActiveIds = currentActive.map((r) => r.id);
        await supabaseAdmin
          .from("user_sentences")
          .update({ is_active: false })
          .in("id", currentActiveIds);
      }

      // Check if we can add more (max 10 per week)
      const { data: allThisWeek } = await supabase
        .from("user_sentences")
        .select("id")
        .eq("user_id", user.id)
        .eq("language", language)
        .eq("week_number", currentWeek)
        .eq("year", currentYear);

      if ((allThisWeek?.length ?? 0) >= 10) {
        return NextResponse.json({
          sentences: [],
          generated: false,
          error: "Weekly limit reached",
          weeklyLimit: {
            total: allThisWeek?.length ?? 10,
            max: 10,
          },
        });
      }

      // Get 5 new sentences
      const newSentences = await getNewSentences(
        supabase,
        supabaseAdmin,
        user.id,
        language,
        level,
        topic_id,
        custom_topic,
        interface_language,
        5
      );

      // Save with current week info
      for (const s of newSentences) {
        await supabaseAdmin.from("user_sentences").insert({
          user_id: user.id,
          sentence_id: s.id,
          language,
          understood_parts: [],
          all_understood: false,
          times_shown: 0,
          last_shown_at: null,
          fully_mastered: false,
          first_seen_at: new Date().toISOString(),
          is_active: true,
          week_number: currentWeek,
          year: currentYear,
        });
      }

      return NextResponse.json({
        sentences: newSentences,
        generated: true,
        weeklyLimit: {
          total: (allThisWeek?.length ?? 0) + newSentences.length,
          max: 10,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Sentences error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────
// Helper: Get new sentences
// ─────────────────────────────────────────
async function getNewSentences(
  supabase: any,
  supabaseAdmin: any,
  userId: string,
  language: LearningLang,
  level: Level,
  topicId: string | undefined,
  customTopic: string | undefined,
  interfaceLanguage: InterfaceLang,
  count: number
) {
  // Get sentences user has already seen
  const { data: seenData } = await supabase
    .from("user_sentences")
    .select("sentence_id")
    .eq("user_id", userId)
    .eq("language", language);

  const seenSet = new Set((seenData ?? []).map((r: any) => r.sentence_id));

  // Query available sentences
  let query = supabase
    .from("sentences")
    .select(
      "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, language, sentence_parts(*)"
    )
    .eq("language", language)
    .eq("level", level);

  if (topicId) query = query.eq("topic_id", topicId);
  if (customTopic) query = query.eq("custom_topic", customTopic);

  const { data: allSentences } = await query;

  // Filter unseen
  const unseen = (allSentences ?? []).filter((s: any) => !seenSet.has(s.id));

  // If enough unseen, use them
  if (unseen.length >= count) {
    return unseen.slice(0, count);
  }

  // Otherwise, use all unseen + generate new ones
  const newSentences = unseen;
  const toGenerate = count - newSentences.length;

  if (toGenerate > 0) {
    let topicName = customTopic ?? "";
    if (!topicName && topicId) {
      const { data: topicData } = await supabase
        .from("topics")
        .select("name_ru, name_en, name_es")
        .eq("id", topicId)
        .single();

      if (topicData) {
        topicName =
          interfaceLanguage === "ru"
            ? topicData.name_ru
            : interfaceLanguage === "es"
              ? topicData.name_es
              : topicData.name_en;
      }
    }

    const generated = await generateSentences({
      language,
      level,
      topicName,
      interfaceLanguage,
      count: toGenerate,
    });

    // Save generated to sentences table
    for (const s of generated) {
      const { data: sentenceRow } = await supabaseAdmin
        .from("sentences")
        .insert({
          language,
          level,
          topic_id: topicId ?? null,
          custom_topic: customTopic ?? null,
          sentence_text: s.sentence_text,
          translation_ru: s.translation_ru,
          translation_en: s.translation_en ?? null,
          ai_model: "gemini",
          times_shown: 0,
        })
        .select()
        .single();

      if (sentenceRow && s.parts.length > 0) {
        await supabaseAdmin.from("sentence_parts").insert(
          s.parts.map((part: any, index: number) => ({
            sentence_id: sentenceRow.id,
            order_index: index,
            text: part.text,
            translation_ru: part.translation_ru,
            translation_en: part.translation_en ?? null,
            pronunciation: part.pronunciation,
            explanation: part.explanation ?? null,
            tip: part.tip ?? null,
          }))
        );

        // Fetch full sentence with parts
        const { data: full } = await supabaseAdmin
          .from("sentences")
          .select("*, sentence_parts(*)")
          .eq("id", sentenceRow.id)
          .single();

        if (full) newSentences.push(full);
      }
    }
  }

  return newSentences;
}

// ─────────────────────────────────────────
// Gemini generation
// ─────────────────────────────────────────
async function generateSentences({
  language,
  level,
  topicName,
  interfaceLanguage,
  count,
}: {
  language: LearningLang;
  level: Level;
  topicName: string;
  interfaceLanguage: InterfaceLang;
  count: number;
}): Promise<GeneratedSentence[]> {
  const langName =
    language === "es" ? "Spanish (Castilian, Spain)" : "English (American)";
  const uiLang =
    interfaceLanguage === "ru"
      ? "Russian"
      : interfaceLanguage === "es"
        ? "Spanish"
        : "English";
  const topic = topicName || "general everyday life";

  const prompt = `You are an expert language teacher creating structured learning materials.

Generate exactly ${count} ${langName} sentences for a student at level ${level}.
Topic: "${topic}"

## Sentence Rules
- Match level ${level} exactly in vocabulary and grammar complexity
- Sentences must be natural and useful in real life situations
- Vary sentence structures (statements, questions, negations — mix them)
- Prefer practical, everyday vocabulary over abstract or literary words
- Each sentence must cover a different grammar pattern or vocabulary area — no repetition

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
- Example: "nosotros hablamos" → "nosOtros abLAmos"
- Avoid English-based approximations — use only sounds natural in ${uiLang}

## Explanation Rules
For each part write a short, encouraging explanation in ${uiLang} (1–2 sentences max):
- Verbs: mention infinitive form + what conjugation this is
- Nouns: mention grammatical gender (el/la) + note if similar to a ${uiLang} word
- Prepositions and connectors: explain the usage pattern, not just the meaning
- Do NOT state obvious things if the translation already says so

## Tip Rules
Add a "tip" field ONLY for: irregular forms, false friends, or tricky pronunciation.
Omit "tip" entirely when there is nothing non-obvious to say.

## Output Format
Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

[
  {
    "sentence_text": "full sentence in ${langName}",
    "translation_ru": "translation in ${uiLang}",
    "parts": [
      {
        "text": "part of sentence",
        "translation_ru": "translation of this part in ${uiLang}",
        "pronunciation": "stress marked with CAPITAL letters",
        "explanation": "grammar note in ${uiLang}",
        "tip": "only if non-obvious — omit otherwise"
      }
    ]
  }
]`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const clean = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(clean) as GeneratedSentence[];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (s) =>
        s.sentence_text &&
        s.translation_ru &&
        Array.isArray(s.parts) &&
        s.parts.length > 0,
    );
  } catch (err) {
    console.error("Gemini error:", err);
    return [];
  }
}

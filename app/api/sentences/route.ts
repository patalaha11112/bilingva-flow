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

    const { language, level, topic_id, custom_topic, interface_language } =
      (await request.json()) as {
        language: LearningLang;
        level: Level;
        topic_id?: string;
        custom_topic?: string;
        interface_language: InterfaceLang;
      };

    // ─────────────────────────────────────────
    // 1. Проверяем БД — есть ли непросмотренные
    // ─────────────────────────────────────────
    const { data: seenIds } = await supabase
      .from("user_sentences")
      .select("sentence_id")
      .eq("user_id", user.id)
      .eq("language", language);

    const seenSet = new Set((seenIds ?? []).map((r) => r.sentence_id));

    const query = supabase
      .from("sentences")
      .select(
        "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, sentence_parts(*)",
      )
      .eq("language", language)
      .eq("level", level)
      .order("created_at", { ascending: true });

    if (topic_id) query.eq("topic_id", topic_id);
    if (custom_topic) query.eq("custom_topic", custom_topic);

    const { data: allSentences } = await query;

    const unseen = (allSentences ?? []).filter((s) => !seenSet.has(s.id));

    // Достаточно непросмотренных — возвращаем 5
    if (unseen.length >= 5) {
      return NextResponse.json({
        sentences: unseen.slice(0, 5),
        generated: false,
      });
    }

    // ─────────────────────────────────────────
    // 2. Нужна генерация — получаем тему
    // ─────────────────────────────────────────
    let topicName = custom_topic ?? "";

    if (!topicName && topic_id) {
      const { data: topicData } = await supabase
        .from("topics")
        .select("name_ru, name_en, name_es")
        .eq("id", topic_id)
        .single();

      if (topicData) {
        topicName =
          interface_language === "ru"
            ? topicData.name_ru
            : interface_language === "es"
              ? topicData.name_es
              : topicData.name_en;
      }
    }

    // ─────────────────────────────────────────
    // 3. Генерируем 20 предложений через Gemini
    // ─────────────────────────────────────────
    const generated = await generateSentences({
      language,
      level,
      topicName,
      interfaceLanguage: interface_language,
      count: 5,
    });

    if (!generated.length) {
      return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }

    // ─────────────────────────────────────────
    // 4. Сохраняем в Supabase
    // ─────────────────────────────────────────
    const saved = [];
    let lastDbError = null;

    for (const s of generated) {
      // Сохраняем предложение
      const { data: sentenceRow, error: sentenceErr } = await supabaseAdmin
        .from("sentences")
        .insert({
          language,
          level,
          topic_id: topic_id ?? null,
          custom_topic: custom_topic ?? null,
          sentence_text: s.sentence_text,
          translation_ru: s.translation_ru,
          translation_en: s.translation_en ?? null,
          ai_model: "gemini",
        })
        .select()
        .single();

      if (sentenceErr || !sentenceRow) {
        console.error("Supabase sentence insert error:", sentenceErr);
        lastDbError = sentenceErr;
        continue;
      }

      // Сохраняем части
      if (s.parts.length > 0) {
        const { error: partsErr } = await supabaseAdmin.from("sentence_parts").insert(
          s.parts.map((part, index) => ({
            sentence_id: sentenceRow.id,
            order_index: index,
            text: part.text,
            translation_ru: part.translation_ru,
            translation_en: part.translation_en ?? null,
            pronunciation: part.pronunciation,
            explanation: part.explanation ?? null,
            tip: part.tip ?? null,
          })),
        );
        if (partsErr) {
          console.error("Supabase sentence parts insert error:", partsErr);
          lastDbError = partsErr;
        }
      }

      // Подгружаем с частями
      const { data: full, error: fetchErr } = await supabaseAdmin
        .from("sentences")
        .select("*, sentence_parts(*)")
        .eq("id", sentenceRow.id)
        .single();

      if (fetchErr) {
        console.error("Supabase fetch full sentence error:", fetchErr);
        lastDbError = fetchErr;
      }

      if (full) saved.push(full);
    }

    if (generated.length > 0 && saved.length === 0) {
      return NextResponse.json({
        error: "Failed to save generated sentences to database",
        details: lastDbError ? lastDbError.message : "Unknown database error",
        rawError: lastDbError
      }, { status: 500 });
    }

    return NextResponse.json({
      sentences: saved.slice(0, 5),
      generated: true,
      total_saved: saved.length,
    });
  } catch (error) {
    console.error("Sentences generate error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Internal error",
      details: error
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// Gemini generation
// ─────────────────────────────────────────────

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

  const prompt = `You are a language teacher creating learning materials.

Generate exactly ${count} ${langName} sentences for a student at level ${level}.
Topic: "${topic}"

Rules:
- Sentences must match level ${level} exactly (vocabulary, grammar complexity)
- Each sentence should be natural, useful in real life
- Split each sentence into 2-5 meaningful parts (phrases, not single words when possible)
- For each part provide pronunciation written as it sounds to a ${uiLang} speaker
- Explanations and translations must be in ${uiLang}
- Be encouraging and positive in explanations
- Vary sentence structures

Return ONLY valid JSON array, no markdown, no extra text:
[
  {
    "sentence_text": "full sentence in ${langName}",
    "translation_ru": "translation in ${uiLang}",
    "parts": [
      {
        "text": "part of sentence",
        "translation_ru": "translation of this part in ${uiLang}",
        "pronunciation": "how it sounds to ${uiLang} speaker",
        "explanation": "grammar or usage note in ${uiLang} (1-2 sentences, interesting fact)",
        "tip": "memory tip in ${uiLang} (optional, only if useful)"
      }
    ]
  }
]`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Чистим возможные markdown-обёртки
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

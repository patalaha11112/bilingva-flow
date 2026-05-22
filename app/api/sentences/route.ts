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

// Получить начало текущей ISO-недели (понедельник)
function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
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

    const { language, level, topic_id, custom_topic, interface_language } =
      (await request.json()) as {
        language: LearningLang;
        level: Level;
        topic_id?: string;
        custom_topic?: string;
        interface_language: InterfaceLang;
      };

    const weekStart = getWeekStartDate();

    // ─────────────────────────────────────────
    // 1. Проверяем, есть ли у пользователя предложения на эту неделю
    // ─────────────────────────────────────────
    const { data: existingUserSentences } = await supabase
      .from("user_sentences")
      .select("sentence_id")
      .eq("user_id", user.id)
      .eq("language", language)
      .gte("first_seen_at", weekStart);

    const weekSentenceIds = (existingUserSentences ?? []).map(
      (r) => r.sentence_id
    );

    // Если уже есть предложения на эту неделю — возвращаем их
    if (weekSentenceIds.length >= 5) {
      const { data: weekSentences } = await supabase
        .from("sentences")
        .select(
          "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, language, sentence_parts(*)"
        )
        .in("id", weekSentenceIds)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        sentences: weekSentences ?? [],
        generated: false,
      });
    }

    // Если есть часть предложений — загружаем их, чтобы потом дополнить
    let existingSentences: any[] = [];
    if (weekSentenceIds.length > 0) {
      const { data } = await supabase
        .from("sentences")
        .select(
          "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, language, sentence_parts(*)"
        )
        .in("id", weekSentenceIds)
        .order("created_at", { ascending: true });
      existingSentences = data ?? [];
    }

    const needed = 5 - weekSentenceIds.length;

    // ─────────────────────────────────────────
    // 2. Ищем неиспользованные предложения в БД
    // ─────────────────────────────────────────
    const { data: allSeenIds } = await supabase
      .from("user_sentences")
      .select("sentence_id")
      .eq("user_id", user.id)
      .eq("language", language);

    const seenSet = new Set((allSeenIds ?? []).map((r) => r.sentence_id));

    const query = supabase
      .from("sentences")
      .select(
        "id, sentence_text, translation_ru, translation_en, topic_id, custom_topic, language, sentence_parts(*)"
      )
      .eq("language", language)
      .eq("level", level)
      .order("created_at", { ascending: true });

    if (topic_id) query.eq("topic_id", topic_id);
    if (custom_topic) query.eq("custom_topic", custom_topic);

    const { data: allSentences } = await query;

    const unseen = (allSentences ?? []).filter((s) => !seenSet.has(s.id));

    let newSentences: any[] = [];

    if (unseen.length >= needed) {
      // Достаточно из БД
      newSentences = unseen.slice(0, needed);
    } else {
      // Берём что есть + генерируем остальные
      newSentences = unseen.slice(0, needed);
      const toGenerate = needed - newSentences.length;

      if (toGenerate > 0) {
        // ─────────────────────────────────────────
        // 3. Генерация через Gemini
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

        const generated = await generateSentences({
          language,
          level,
          topicName,
          interfaceLanguage: interface_language,
          count: toGenerate,
        });

        // ─────────────────────────────────────────
        // 4. Сохраняем в Supabase
        // ─────────────────────────────────────────
        let lastDbError = null;

        for (const s of generated) {
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
              visual_svg: s.visual_svg ?? null,
              ai_model: "gemini",
            })
            .select()
            .single();

          if (sentenceErr || !sentenceRow) {
            console.error("Supabase sentence insert error:", sentenceErr);
            lastDbError = sentenceErr;
            continue;
          }

          if (s.parts.length > 0) {
            const { error: partsErr } = await supabaseAdmin
              .from("sentence_parts")
              .insert(
                s.parts.map((part, index) => ({
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
            if (partsErr) {
              console.error("Supabase sentence parts insert error:", partsErr);
              lastDbError = partsErr;
            }
          }

          const { data: full, error: fetchErr } = await supabaseAdmin
            .from("sentences")
            .select("*, sentence_parts(*)")
            .eq("id", sentenceRow.id)
            .single();

          if (fetchErr) {
            console.error("Supabase fetch full sentence error:", fetchErr);
            lastDbError = fetchErr;
          }

          if (full) newSentences.push(full);
        }

        if (generated.length > 0 && newSentences.length === 0 && existingSentences.length === 0) {
          return NextResponse.json(
            {
              error: "Failed to save generated sentences to database",
              details: lastDbError ? lastDbError.message : "Unknown database error",
              rawError: lastDbError,
            },
            { status: 500 }
          );
        }
      }
    }

    // ─────────────────────────────────────────
    // 5. Привязываем новые предложения к пользователю (текущая неделя)
    // ─────────────────────────────────────────
    for (const s of newSentences) {
      await supabaseAdmin.from("user_sentences").upsert(
        {
          user_id: user.id,
          sentence_id: s.id,
          language,
          understood_parts: [],
          all_understood: false,
          times_shown: 1,
          last_shown_at: new Date().toISOString(),
          fully_mastered: false,
        },
        { onConflict: "user_id,sentence_id" }
      );
    }

    const allWeekSentences = [...existingSentences, ...newSentences];

    return NextResponse.json({
      sentences: allWeekSentences,
      generated: newSentences.length > 0,
      total: allWeekSentences.length,
    });
  } catch (error) {
    console.error("Sentences generate error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal error",
        details: error,
      },
      { status: 500 }
    );
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
- For each sentence, generate a minimal SVG illustration representing the key noun or action

SVG Rules:
- viewBox="0 0 100 100", no width/height attributes
- Maximum 2 simple shapes (circle, rect, path)
- Single color fill using currentColor so it inherits from CSS
- No text, no gradients, no complex paths
- Rounded, friendly style — use rx on rects, smooth curves
- Return as "visual_svg" string (complete SVG markup)

Return ONLY valid JSON array, no markdown, no extra text:
[
  {
    "sentence_text": "full sentence in ${langName}",
    "translation_ru": "translation in ${uiLang}",
    "visual_svg": "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><path d='...' fill='currentColor'/></svg>",
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

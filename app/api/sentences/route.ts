import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localized } from "@/lib/languages";
import { AI_MODELS, generateJson } from "@/lib/server/ai";
import { SENTENCES_SCHEMA, sentencesPrompt } from "@/lib/server/prompts";
import { LIMITS, getWeekStart, isAppAdmin, sanitizePromptText } from "@/lib/server/access";
import { SentencesBody, parseBody } from "@/lib/server/validation";
import type {
  LearningLang,
  Level,
  InterfaceLang,
  GeneratedSentence,
} from "@/types/database";


const SENTENCE_FIELDS =
  "id, sentence_text, translation, topic_id, custom_topic, language, interface_language, sentence_parts(*)";

/**
 * The user's active sentences this week for one learning language, written for
 * one interface language (switching the interface language shows a separate set).
 */
function activeThisWeek(
  supabase: any,
  userId: string,
  language: LearningLang,
  interfaceLanguage: InterfaceLang,
  weekStart: string,
  columns: string,
  options?: { count: "exact"; head: true }
) {
  return supabase
    .from("user_sentences")
    .select(`${columns}, sentences!inner(interface_language)`, options)
    .eq("user_id", userId)
    .eq("language", language)
    .eq("sentences.interface_language", interfaceLanguage)
    .gte("first_seen_at", weekStart)
    .eq("is_active", true);
}

/** Links new sentences to the user as part of the current week's active set */
async function linkSentences(supabase: any, userId: string, language: LearningLang, sentenceIds: string[]) {
  if (sentenceIds.length === 0) return;
  const { error } = await supabase.from("user_sentences").insert(
    sentenceIds.map((sentence_id) => ({
      user_id: userId,
      sentence_id,
      language,
      understood_parts: [],
      is_active: true,
    }))
  );
  if (error) console.error("[sentences] link error:", error.message);
}

// AI generation takes 10–25 s; allow for a slow primary model plus the fallback
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Admin client only for inserting into the shared sentences pool
    const supabaseAdmin = createAdminClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseBody(request, SentencesBody);
    if (parsed.error) return parsed.error;
    const { language, level, topic_id, custom_topic, interface_language, refresh, add_count } = parsed.data;

    const weekStart = getWeekStart();
    const admin = await isAppAdmin(user.id);

    // Custom topics end up in the shared sentence pool, so only admins may set them
    const customTopic =
      admin && typeof custom_topic === "string"
        ? sanitizePromptText(custom_topic, LIMITS.customTopicMaxChars) || undefined
        : undefined;

    // How many more sentences this user may get this week (AI cost guard)
    const { count: linkedThisWeek } = await supabase
      .from("user_sentences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("language", language)
      .gte("first_seen_at", weekStart);
    const remaining = admin ? Infinity : LIMITS.sentencesPerWeek - (linkedThisWeek ?? 0);
    const maxActive = admin ? 100 : LIMITS.activeSentences;
    const limitReached = () =>
      NextResponse.json({ error: "Weekly limit reached", code: "limit_reached" }, { status: 429 });

    // ─────────────────────────────────────────
    // ADD 1: add exactly N new sentences
    // ─────────────────────────────────────────
    if (add_count) {
      const { count: activeCount } = await activeThisWeek(
        supabase, user.id, language, interface_language, weekStart, "id", { count: "exact", head: true }
      );
      const requested = admin ? Math.min(add_count, 20) : 1;
      const count = Math.min(requested, remaining, maxActive - (activeCount ?? 0));
      if (count <= 0) return limitReached();

      const newSentences = await getNewSentences(
        supabase,
        supabaseAdmin,
        user.id,
        language,
        level,
        topic_id,
        customTopic,
        interface_language,
        count
      );

      await linkSentences(supabase, user.id, language, newSentences.map((s: any) => s.id));

      const { data: allActive } = await activeThisWeek(
        supabase, user.id, language, interface_language, weekStart, "id"
      );

      const addIds = newSentences.map((s: any) => s.id)
      const userProgress = await fetchUserProgress(supabase, user.id, addIds)
      return NextResponse.json({
        sentences: newSentences,
        generated: true,
        weeklyLimit: { total: allActive?.length ?? count, max: maxActive },
        userProgress,
      });
    }

    // ─────────────────────────────────────────
    // 1. Get active sentences for this week
    // ─────────────────────────────────────────
    if (!refresh) {
      const { data: activeRows, error: activeError } = await activeThisWeek(
        supabase, user.id, language, interface_language, weekStart, "sentence_id"
      ).order("first_seen_at", { ascending: true });
      if (activeError) console.error("[sentences] active fetch error:", activeError.message);

      const activeSentenceIds: string[] = (activeRows ?? []).map((r: any) => r.sentence_id);

      // All of this week's sentences, in the order they were added
      let existingSentences: any[] = [];
      if (activeSentenceIds.length > 0) {
        const { data } = await supabase
          .from("sentences")
          .select(SENTENCE_FIELDS)
          .in("id", activeSentenceIds);
        const byId = new Map((data ?? []).map((s: any) => [s.id, s]));
        existingSentences = activeSentenceIds.map((id) => byId.get(id)).filter(Boolean);
      }

      // Fill the week up to 5 sentences
      const needed = Math.max(0, Math.min(5 - existingSentences.length, remaining));
      const newSentences = needed > 0
        ? await getNewSentences(
            supabase,
            supabaseAdmin,
            user.id,
            language,
            level,
            topic_id,
            customTopic,
            interface_language,
            needed
          )
        : [];
      await linkSentences(supabase, user.id, language, newSentences.map((s: any) => s.id));

      const totalSentences = [...existingSentences, ...newSentences];
      const userProgress = await fetchUserProgress(supabase, user.id, totalSentences.map((s: any) => s.id));
      return NextResponse.json({
        sentences: totalSentences,
        generated: newSentences.length > 0,
        weeklyLimit: { total: totalSentences.length, max: maxActive },
        userProgress,
      });
    }

    // ─────────────────────────────────────────
    // 2. REFRESH: replace active set with 5 new, keep progress
    // ─────────────────────────────────────────
    if (refresh) {
      if (remaining < 5) return limitReached();

      const { data: currentActive } = await activeThisWeek(
        supabase, user.id, language, interface_language, weekStart, "id"
      );

      // Get 5 new sentences first, so a generation failure leaves the current set intact
      const newSentences = await getNewSentences(
        supabase,
        supabaseAdmin,
        user.id,
        language,
        level,
        topic_id,
        customTopic,
        interface_language,
        5
      );

      // Hide current sentences (progress is kept for hints and history)
      if (currentActive && currentActive.length > 0) {
        await supabase
          .from("user_sentences")
          .update({ is_active: false })
          .in("id", currentActive.map((r: any) => r.id));
      }

      // Save with current week info
      await linkSentences(supabase, user.id, language, newSentences.map((s: any) => s.id));

      const refreshIds = newSentences.map((s: any) => s.id)
      const userProgress = await fetchUserProgress(supabase, user.id, refreshIds)
      return NextResponse.json({
        sentences: newSentences,
        generated: true,
        weeklyLimit: {
          total: newSentences.length,
          max: maxActive,
        },
        userProgress,
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
// Helper: Get user progress for sentence IDs
// ─────────────────────────────────────────
async function fetchUserProgress(supabase: any, userId: string, sentenceIds: string[]) {
  if (sentenceIds.length === 0) return {}
  const { data, error } = await supabase
    .from('user_sentences')
    .select('sentence_id, understood_parts, all_understood, fully_mastered')
    .eq('user_id', userId)
    .in('sentence_id', sentenceIds)
  if (error) console.error('[sentences] fetchUserProgress error:', error.message)
  const map: Record<string, any> = {}
  for (const row of (data ?? [])) {
    map[row.sentence_id] = row
  }
  return map
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
  // Sentences the user has already seen
  const { data: seenData } = await supabase
    .from("user_sentences")
    .select("sentence_id")
    .eq("user_id", userId)
    .eq("language", language);

  const seenSet = new Set((seenData ?? []).map((r: any) => r.sentence_id));

  // Query available sentences
  let query = supabase
    .from("sentences")
    .select(SENTENCE_FIELDS)
    .eq("language", language)
    .eq("interface_language", interfaceLanguage)
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
        .select("name")
        .eq("id", topicId)
        .single();

      if (topicData) {
        topicName = localized(topicData.name, interfaceLanguage);
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
          interface_language: interfaceLanguage,
          translation: s.translation,
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
            translation: part.translation,
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
// AI generation
// ─────────────────────────────────────────
async function generateSentences(params: {
  language: LearningLang;
  level: Level;
  topicName: string;
  interfaceLanguage: InterfaceLang;
  count: number;
}): Promise<GeneratedSentence[]> {
  try {
    const parsed = await generateJson<GeneratedSentence[]>(
      AI_MODELS.sentences,
      sentencesPrompt(params),
      SENTENCES_SCHEMA
    );
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s.sentence_text && s.translation && Array.isArray(s.parts) && s.parts.length > 0)
      .slice(0, params.count);
  } catch (err) {
    console.error("[sentences] AI error:", err);
    return [];
  }
}

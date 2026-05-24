import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LearningLang } from "@/types/database";

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sentence_id, part_id, mark_all, language } = (await request.json()) as {
      sentence_id: string;
      part_id?: string;
      mark_all?: boolean;
      language: LearningLang;
    };

    const { data: currentRows } = await supabaseAdmin
      .from("user_sentences")
      .select("*")
      .eq("user_id", user.id)
      .eq("sentence_id", sentence_id)
      .limit(1);

    const current = currentRows?.[0] ?? null;
    console.log('[progress] sentence_id:', sentence_id, 'found rows:', currentRows?.length ?? 0, 'current:', !!current);

    const { data: partsData } = await supabaseAdmin
      .from("sentence_parts")
      .select("id")
      .eq("sentence_id", sentence_id);

    const allPartIds = (partsData ?? []).map((p: { id: string }) => p.id);
    const currentParts: string[] = current?.understood_parts ?? [];

    let newParts: string[];
    let allUnderstood: boolean;

    if (mark_all) {
      const isAllUnderstood = currentParts.length >= allPartIds.length && allPartIds.length > 0;
      newParts = isAllUnderstood ? [] : allPartIds;
      allUnderstood = !isAllUnderstood;
    } else if (part_id) {
      if (currentParts.includes(part_id)) {
        newParts = currentParts.filter((id) => id !== part_id);
      } else {
        newParts = [...currentParts, part_id];
      }
      allUnderstood = allPartIds.length > 0 && newParts.length >= allPartIds.length;
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { week, year } = getISOWeek(new Date());

    let data: any = null;
    let error: any = null;

    if (current) {
      // Record exists — update in place
      const res = await supabaseAdmin
        .from("user_sentences")
        .update({
          understood_parts: newParts,
          all_understood: allUnderstood,
          last_shown_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("sentence_id", sentence_id)
        .select()
        .single();
      data = res.data;
      error = res.error;
    } else {
      // No record yet — insert fresh
      const res = await supabaseAdmin
        .from("user_sentences")
        .insert({
          user_id: user.id,
          sentence_id,
          language,
          understood_parts: newParts,
          all_understood: allUnderstood,
          fully_mastered: false,
          times_shown: 1,
          last_shown_at: new Date().toISOString(),
          is_active: true,
          week_number: week,
          year,
        })
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("[progress] save error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[progress] saved ok, all_understood:', data?.all_understood, 'parts count:', data?.understood_parts?.length);
    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

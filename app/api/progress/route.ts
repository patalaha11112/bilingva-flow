import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProgressBody, parseBody } from "@/lib/server/validation";

/**
 * Saves which parts of a sentence the user understands.
 * The client sends the full new set (not a toggle), so rapid clicks can't
 * overwrite each other with stale state.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await parseBody(request, ProgressBody);
    if (parsed.error) return parsed.error;
    const { sentence_id, understood_parts, language } = parsed.data;

    const { data: partsData } = await supabase
      .from("sentence_parts")
      .select("id")
      .eq("sentence_id", sentence_id);

    const allPartIds = new Set((partsData ?? []).map((p: { id: string }) => p.id));
    const newParts = [...new Set(understood_parts)].filter((id) => allPartIds.has(id));
    const allUnderstood = allPartIds.size > 0 && newParts.length === allPartIds.size;

    const fields = {
      understood_parts: newParts,
      all_understood: allUnderstood,
      last_shown_at: new Date().toISOString(),
    };

    const { data: updated, error: updateError } = await supabase
      .from("user_sentences")
      .update(fields)
      .eq("user_id", user.id)
      .eq("sentence_id", sentence_id)
      .select();

    if (updateError) {
      console.error("[progress] update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let progress = updated?.[0] ?? null;

    // Normally the row is created when the sentence is shown; create it if missing
    if (!progress) {
      const { data: inserted, error: insertError } = await supabase
        .from("user_sentences")
        .insert({ user_id: user.id, sentence_id, language, is_active: true, ...fields })
        .select()
        .single();
      if (insertError) {
        console.error("[progress] insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      progress = inserted;
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

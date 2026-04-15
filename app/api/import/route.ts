import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { content, ContentTree, QuestionDef } from "@/data/content";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function isQuestionArray(value: ContentTree | QuestionDef[]): value is QuestionDef[] {
  return Array.isArray(value);
}

interface SyncResult { categoriesCreated: number; categoriesUpdated: number; questionsCreated: number; questionsSkipped: number; }

async function syncTree(supabase: any, tree: ContentTree, parentId: string | null, parentPath: string, result: SyncResult) {
  for (const [name, value] of Object.entries(tree)) {
    const path = parentPath ? `${parentPath}/${slugify(name)}` : slugify(name);

    const { data: existing } = await supabase.from('categories').select('id').eq('path', path).single();
    let catId: string;

    if (!existing) {
      const { data: newCat } = await supabase
        .from('categories').insert({ name, parent_id: parentId, path, sort_order: 0 }).select('id').single();
      catId = newCat.id;
      result.categoriesCreated++;
    } else {
      await supabase.from('categories').update({ name, parent_id: parentId }).eq('id', existing.id);
      catId = existing.id;
      result.categoriesUpdated++;
    }

    if (isQuestionArray(value)) {
      for (const q of value) {
        const text = q.q.trim();
        const { data: existingQ } = await supabase
          .from('questions').select('id').eq('category_id', catId).eq('text', text).single();

        if (existingQ) { result.questionsSkipped++; continue; }

        const correctAnswers = Array.isArray(q.a) ? q.a : [q.a];
        const type = q.type ?? (correctAnswers.length > 1 ? "multiple" : "single");

        await supabase.from('questions').insert({
          category_id: catId, text, type,
          correct: correctAnswers, incorrect: q.wrong ?? [], difficulty: 1, tags: [],
        });
        result.questionsCreated++;
      }
    } else {
      await syncTree(supabase, value, catId, path, result);
    }
  }
}

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    const result: SyncResult = { categoriesCreated: 0, categoriesUpdated: 0, questionsCreated: 0, questionsSkipped: 0 };
    await syncTree(supabase, content, null, "", result);
    return NextResponse.json({ data: result, message: "Sync complete" });
  } catch (err) {
    console.error("[POST /import]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

export async function GET() {
  function countTree(tree: ContentTree | QuestionDef[]): { cats: number; qs: number } {
    if (Array.isArray(tree)) return { cats: 0, qs: tree.length };
    let cats = 0, qs = 0;
    for (const v of Object.values(tree)) { cats++; const sub = countTree(v as any); cats += sub.cats; qs += sub.qs; }
    return { cats, qs };
  }
  const { cats, qs } = countTree(content);
  return NextResponse.json({ data: { categories: cats, questions: qs }, message: "Call POST /api/import to sync" });
}
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

interface QuestionDef {
  q: string;
  a: string | string[];
  wrong?: string[];
  type?: 'single' | 'multiple';
}

// Use interface (not type alias) so TypeScript can handle the self-reference
interface ContentTree {
  [key: string]: ContentTree | QuestionDef[] | QuestionDef | undefined;
}

interface SyncResult {
  categoriesCreated: number;
  categoriesUpdated: number;
  questionsCreated: number;
  questionsSkipped: number;
  questionsUpdated: number;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function isQuestionArray(v: unknown): v is QuestionDef[] {
  return Array.isArray(v) && (v.length === 0 || (typeof v[0] === 'object' && v[0] !== null && 'q' in (v[0] as object)));
}

type SupabaseAdmin = ReturnType<typeof import('@/lib/supabase').getSupabaseAdmin>;

async function syncQuestions(
  supabase: SupabaseAdmin,
  catId: string,
  questions: QuestionDef[],
  result: SyncResult,
  mode: 'merge' | 'replace'
) {
  for (const q of questions) {
    const text = q.q.trim();
    const correctAnswers = Array.isArray(q.a) ? q.a : [q.a];
    const type = q.type ?? (correctAnswers.length > 1 ? 'multiple' : 'single');

    const { data: existingQ } = await supabase
      .from('questions').select('id').eq('category_id', catId).eq('text', text).single();

    if (existingQ) {
      if (mode === 'replace') {
        await supabase.from('questions').update({
          type,
          correct: correctAnswers,
          incorrect: q.wrong ?? [],
        }).eq('id', existingQ.id);
        result.questionsUpdated++;
      } else {
        result.questionsSkipped++;
      }
      continue;
    }

    await supabase.from('questions').insert({
      category_id: catId,
      text,
      type,
      correct: correctAnswers,
      incorrect: q.wrong ?? [],
      difficulty: 1,
      tags: [],
    });
    result.questionsCreated++;
  }
}

async function syncTree(
  supabase: SupabaseAdmin,
  tree: ContentTree,
  parentId: string | null,
  parentPath: string,
  result: SyncResult,
  mode: 'merge' | 'replace'
) {
  for (const [name, value] of Object.entries(tree)) {
    if (name === '_questions' && isQuestionArray(value)) continue;

    const path = parentPath ? `${parentPath}/${slugify(name)}` : slugify(name);

    const { data: existing } = await supabase
      .from('categories').select('id').eq('path', path).single();

    let catId: string;

    if (!existing) {
      const { data: newCat } = await supabase
        .from('categories')
        .insert({ name, parent_id: parentId, path, sort_order: 0 })
        .select('id')
        .single();
      catId = newCat!.id;
      result.categoriesCreated++;
    } else {
      await supabase.from('categories').update({ name, parent_id: parentId }).eq('id', existing.id);
      catId = existing.id;
      result.categoriesUpdated++;
    }

    if (isQuestionArray(value)) {
      await syncQuestions(supabase, catId, value, result, mode);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const subtree = value as ContentTree;

      if ('_questions' in subtree && isQuestionArray(subtree['_questions'])) {
        await syncQuestions(supabase, catId, subtree['_questions'] as QuestionDef[], result, mode);
      }

      const subEntries = Object.entries(subtree).filter(([k]) => k !== '_questions');
      if (subEntries.length > 0) {
        await syncTree(supabase, Object.fromEntries(subEntries) as ContentTree, catId, path, result, mode);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername || session.username !== adminUsername) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { tree, mode = 'merge' } = body as { tree: ContentTree; mode?: 'merge' | 'replace' };

    if (!tree || typeof tree !== 'object') {
      return NextResponse.json({ error: 'Invalid import data — expected JSON object' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const result: SyncResult = {
      categoriesCreated: 0,
      categoriesUpdated: 0,
      questionsCreated: 0,
      questionsSkipped: 0,
      questionsUpdated: 0,
    };

    await syncTree(supabase, tree, null, '', result, mode);

    return NextResponse.json({ data: result, message: 'Import complete' });
  } catch (err) {
    console.error('[POST /admin/import]', err);
    return NextResponse.json({ error: 'Import failed: ' + String(err) }, { status: 500 });
  }
}
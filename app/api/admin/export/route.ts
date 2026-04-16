import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername || session.username !== adminUsername) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const [{ data: cats }, { data: questions }] = await Promise.all([
      supabase.from('categories').select('id, name, parent_id, path').order('path'),
      supabase.from('questions').select('id, category_id, text, type, correct, incorrect'),
    ]);

    if (!cats) return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });

    // Group questions by category id
    const qByCategory: Record<string, typeof questions> = {};
    for (const q of questions || []) {
      if (!qByCategory[q.category_id]) qByCategory[q.category_id] = [];
      qByCategory[q.category_id]!.push(q);
    }

    // Build category map
    const catMap: Record<string, typeof cats[0] & { children: string[] }> = {};
    for (const cat of cats) {
      catMap[cat.id] = { ...cat, children: [] };
    }

    // Build tree structure
    const roots: string[] = [];
    for (const cat of cats) {
      if (cat.parent_id && catMap[cat.parent_id]) {
        catMap[cat.parent_id].children.push(cat.id);
      } else if (!cat.parent_id) {
        roots.push(cat.id);
      }
    }

    // Recursively build export tree
    function buildNode(catId: string): Record<string, unknown> | Array<Record<string, unknown>> {
      const cat = catMap[catId];
      const directQuestions = qByCategory[catId] || [];
      const children = cat.children;

      const result: Record<string, unknown> = {};

      // Add subcategories
      for (const childId of children) {
        const childCat = catMap[childId];
        result[childCat.name] = buildNode(childId);
      }

      // Add direct questions (as a special "_questions" key if also has children, else as array)
      if (directQuestions.length > 0) {
        const qs = directQuestions.map(q => ({
          q: q.text,
          a: q.correct.length === 1 ? q.correct[0] : q.correct,
          ...(q.incorrect?.length ? { wrong: q.incorrect } : {}),
          ...(q.type === 'multiple' ? { type: 'multiple' as const } : {}),
        }));

        if (children.length > 0) {
          // Has subcategories too — use _questions key
          result['_questions'] = qs;
        } else {
          // Leaf node — just return the array directly
          return qs;
        }
      }

      return result;
    }

    const tree: Record<string, unknown> = {};
    for (const rootId of roots) {
      const root = catMap[rootId];
      tree[root.name] = buildNode(rootId);
    }

    return NextResponse.json({ data: tree });
  } catch (err) {
    console.error('[GET /admin/export]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
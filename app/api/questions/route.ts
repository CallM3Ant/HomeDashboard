import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const includeSubs = searchParams.get('includeSubcategories') === 'true';
    const session = await getCurrentUser();
    const supabase = getSupabaseAdmin();

    let questions: any[];

    if (!categoryId) {
      const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: false });
      questions = data || [];
    } else if (includeSubs) {
      const { data: category } = await supabase.from('categories').select('path').eq('id', categoryId).single();
      if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

      const { data: allCats } = await supabase
        .from('categories').select('id')
        .or(`path.eq.${category.path},path.like.${category.path}/%`);

      const catIds = (allCats || []).map(c => c.id);
      const { data } = await supabase.from('questions').select('*')
        .in('category_id', catIds).order('created_at', { ascending: true });
      questions = data || [];
    } else {
      const { data } = await supabase.from('questions').select('*')
        .eq('category_id', categoryId).order('created_at', { ascending: true });
      questions = data || [];
    }

    let statsMap: Record<string, any> = {};
    if (session) {
      const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', session.userId);
      statsMap = Object.fromEntries((stats || []).map(s => [s.question_id, s]));
    }

    const result = questions.map(q => ({ ...q, stats: statsMap[q.id] ?? null }));
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[GET /questions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session)
      return NextResponse.json({ error: 'Must be logged in to add questions' }, { status: 401 });

    const { category_id, text, type, correct, incorrect, difficulty, tags } = await req.json();

    if (!category_id || !text || !type || !correct?.length)
      return NextResponse.json({ error: 'category_id, text, type, and at least one correct answer are required' }, { status: 400 });

    if (!['single', 'multiple'].includes(type))
      return NextResponse.json({ error: 'type must be "single" or "multiple"' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: catExists } = await supabase.from('categories').select('id').eq('id', category_id).single();
    if (!catExists) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const { data: newQ, error } = await supabase
      .from('questions')
      .insert({ category_id, text: text.trim(), type, correct, incorrect: incorrect ?? [], difficulty: difficulty ?? 1, tags: tags ?? [], created_by: session.userId })
      .select().single();

    if (error) throw error;

    return NextResponse.json({ data: newQ, message: 'Question added' }, { status: 201 });
  } catch (err) {
    console.error('[POST /questions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
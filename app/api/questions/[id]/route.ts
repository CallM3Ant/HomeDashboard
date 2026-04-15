import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });

    const { id } = await params;
    const { text, type, correct, incorrect } = await req.json();
    const supabase = getSupabaseAdmin();

    const { data: question } = await supabase.from('questions').select('id').eq('id', id).single();
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const { data: updated, error } = await supabase
      .from('questions').update({ text, type, correct, incorrect }).eq('id', id).select().single();

    if (error) throw error;
    return NextResponse.json({ message: 'Question updated', data: updated });
  } catch (err) {
    console.error('[PATCH /questions/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Must be logged in' }, { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    await supabase.from('user_stats').delete().eq('question_id', id);
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('[DELETE /questions/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
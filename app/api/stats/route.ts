import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();

    const [{ data: questions }, { data: stats }] = await Promise.all([
      supabase.from('questions').select('id, category_id'),
      supabase
        .from('user_stats')
        .select('question_id, correct_count, total_attempts, mastered')
        .eq('user_id', session.userId),
    ]);

    if (!questions) return NextResponse.json({ data: {} });

    const statsMap: Record<string, { correct_count: number; total_attempts: number; mastered: boolean }> = {};
    for (const s of stats || []) {
      statsMap[s.question_id] = s;
    }

    const agg: Record<string, { total: number; attempted: number; mastered: number; totalCorrect: number; totalAttempts: number }> = {};

    for (const q of questions) {
      const id = q.category_id;
      if (!agg[id]) agg[id] = { total: 0, attempted: 0, mastered: 0, totalCorrect: 0, totalAttempts: 0 };
      agg[id].total++;
      const s = statsMap[q.id];
      if (s && s.total_attempts > 0) {
        agg[id].attempted++;
        agg[id].totalCorrect += s.correct_count;
        agg[id].totalAttempts += s.total_attempts;
        if (s.mastered) agg[id].mastered++;
      }
    }

    const result: Record<string, {
      total: number; attempted: number; mastered: number;
      masteryPercent: number; accuracy: number;
    }> = {};

    for (const [catId, d] of Object.entries(agg)) {
      result[catId] = {
        total: d.total,
        attempted: d.attempted,
        mastered: d.mastered,
        masteryPercent: d.total > 0 ? Math.round((d.mastered / d.total) * 100) : 0,
        accuracy: d.totalAttempts > 0 ? Math.round((d.totalCorrect / d.totalAttempts) * 100) : 0,
      };
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error('[GET /stats/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
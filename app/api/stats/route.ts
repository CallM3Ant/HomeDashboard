import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const [{ count: totalQuestions }, { data: stats }, { data: streakRow }] = await Promise.all([
      supabase.from('questions').select('*', { count: 'exact', head: true }),
      supabase.from('user_stats').select('*').eq('user_id', session.userId),
      supabase.from('user_streaks').select('streak, last_studied').eq('user_id', session.userId).single(),
    ]);

    const s = stats || [];
    const totalCorrect = s.reduce((sum, x) => sum + x.correct_count, 0);
    const totalAttempts = s.reduce((sum, x) => sum + x.total_attempts, 0);

    return NextResponse.json({
      data: {
        totalQuestions: totalQuestions ?? 0,
        attempted: s.length,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        streak: streakRow?.streak ?? 0,
        lastStudied: streakRow?.last_studied ?? null,
        reviewPool: s.filter(x => x.in_review_pool).length,
        dueToday: s.filter(x => x.total_attempts > 0 && x.next_review <= now).length,
      },
    });
  } catch (err) {
    console.error('[GET /stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
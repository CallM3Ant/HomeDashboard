import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// ─── GET /api/stats ─────────────────────────────────────────────────────────────
// Returns the logged-in user's global stats
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    const totals = db.prepare(`
      SELECT
        COUNT(*) as total_questions
      FROM questions
    `).get() as { total_questions: number };

    const userStats = db.prepare(`
      SELECT
        COUNT(*) as attempted,
        SUM(correct_count) as total_correct,
        SUM(total_attempts) as total_attempts,
        SUM(CASE WHEN in_review_pool = 1 THEN 1 ELSE 0 END) as review_pool,
        SUM(CASE WHEN next_review <= datetime('now') AND total_attempts > 0 THEN 1 ELSE 0 END) as due_today
      FROM user_stats
      WHERE user_id = ?
    `).get(session.userId) as {
      attempted: number;
      total_correct: number;
      total_attempts: number;
      review_pool: number;
      due_today: number;
    };

    const streakRow = db.prepare(
      'SELECT streak, last_studied FROM user_streaks WHERE user_id = ?'
    ).get(session.userId) as { streak: number; last_studied: string | null } | undefined;

    const accuracy = userStats.total_attempts > 0
      ? Math.round((userStats.total_correct / userStats.total_attempts) * 100)
      : 0;

    return NextResponse.json({
      data: {
        totalQuestions: totals.total_questions,
        attempted: userStats.attempted ?? 0,
        accuracy,
        streak: streakRow?.streak ?? 0,
        lastStudied: streakRow?.last_studied ?? null,
        reviewPool: userStats.review_pool ?? 0,
        dueToday: userStats.due_today ?? 0,
      },
    });
  } catch (err) {
    console.error('[GET /stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
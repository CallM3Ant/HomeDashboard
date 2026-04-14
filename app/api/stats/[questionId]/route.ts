import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateSM2 } from '@/lib/spacedRepetition';

type Params = { params: Promise<{ questionId: string }> };

// ─── POST /api/stats/[questionId] ──────────────────────────────────────────────
// Records that a user answered a question (correctly or not)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Must be logged in to save stats' }, { status: 401 });
    }

    const { questionId } = await params;
    const { correct } = await req.json() as { correct: boolean };

    const db = getDb();

    // Verify question exists
    const question = db.prepare('SELECT id FROM questions WHERE id = ?').get(questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    // Get existing stats or defaults
    const existing = db.prepare(`
      SELECT * FROM user_stats WHERE user_id = ? AND question_id = ?
    `).get(session.userId, questionId) as any;

    const sm2Input = existing ? {
      ease_factor: existing.ease_factor,
      interval_days: existing.interval_days,
      next_review: existing.next_review,
      in_review_pool: existing.in_review_pool === 1,
    } : {
      ease_factor: 2.5,
      interval_days: 1,
      next_review: new Date().toISOString(),
      in_review_pool: false,
    };

    const incorrectCount = (existing?.incorrect_count ?? 0) + (correct ? 0 : 1);
    const sm2Result = updateSM2(
      { ...sm2Input, in_review_pool: sm2Input.in_review_pool },
      correct,
      3, // reviewThreshold
      incorrectCount
    );

    if (existing) {
      db.prepare(`
        UPDATE user_stats SET
          correct_count   = correct_count + ?,
          incorrect_count = incorrect_count + ?,
          total_attempts  = total_attempts + 1,
          ease_factor     = ?,
          interval_days   = ?,
          next_review     = ?,
          in_review_pool  = ?,
          last_answered   = datetime('now')
        WHERE user_id = ? AND question_id = ?
      `).run(
        correct ? 1 : 0,
        correct ? 0 : 1,
        sm2Result.ease_factor,
        sm2Result.interval_days,
        sm2Result.next_review,
        sm2Result.in_review_pool ? 1 : 0,
        session.userId,
        questionId
      );
    } else {
      db.prepare(`
        INSERT INTO user_stats
          (user_id, question_id, correct_count, incorrect_count, total_attempts,
           ease_factor, interval_days, next_review, in_review_pool)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).run(
        session.userId,
        questionId,
        correct ? 1 : 0,
        correct ? 0 : 1,
        sm2Result.ease_factor,
        sm2Result.interval_days,
        sm2Result.next_review,
        sm2Result.in_review_pool ? 1 : 0
      );
    }

    // Update streak
    updateStreak(db, session.userId);

    return NextResponse.json({ message: 'Answer recorded', data: sm2Result });
  } catch (err) {
    console.error('[POST /stats/[questionId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function updateStreak(db: any, userId: number) {
  const streak = db.prepare('SELECT streak, last_studied FROM user_streaks WHERE user_id = ?').get(userId) as
    | { streak: number; last_studied: string | null }
    | undefined;

  const today = new Date().toISOString().split('T')[0];

  if (!streak) {
    db.prepare('INSERT INTO user_streaks (user_id, streak, last_studied) VALUES (?, 1, ?)').run(userId, today);
    return;
  }

  if (streak.last_studied === today) return; // Already studied today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = streak.last_studied === yesterdayStr ? streak.streak + 1 : 1;
  db.prepare('UPDATE user_streaks SET streak = ?, last_studied = ? WHERE user_id = ?').run(newStreak, today, userId);
}
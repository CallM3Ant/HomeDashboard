import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { updateSM2 } from '@/lib/spacedRepetition';

type Params = { params: Promise<{ questionId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Must be logged in to save stats' }, { status: 401 });

    const { questionId } = await params;
    const { correct } = await req.json() as { correct: boolean };
    const supabase = getSupabaseAdmin();

    const { data: question } = await supabase.from('questions').select('id').eq('id', questionId).single();
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const { data: existing } = await supabase
      .from('user_stats').select('*').eq('user_id', session.userId).eq('question_id', questionId).single();

    const sm2Input = existing
      ? { ease_factor: existing.ease_factor, interval_days: existing.interval_days, next_review: existing.next_review, in_review_pool: existing.in_review_pool }
      : { ease_factor: 2.5, interval_days: 1, next_review: new Date().toISOString(), in_review_pool: false };

    const sm2Result = updateSM2(sm2Input, correct);

    if (existing) {
      await supabase.from('user_stats').update({
        correct_count: existing.correct_count + (correct ? 1 : 0),
        incorrect_count: existing.incorrect_count + (correct ? 0 : 1),
        total_attempts: existing.total_attempts + 1,
        ease_factor: sm2Result.ease_factor,
        interval_days: sm2Result.interval_days,
        next_review: sm2Result.next_review,
        in_review_pool: sm2Result.in_review_pool,
        last_answered: new Date().toISOString(),
      }).eq('user_id', session.userId).eq('question_id', questionId);
    } else {
      await supabase.from('user_stats').insert({
        user_id: session.userId, question_id: questionId,
        correct_count: correct ? 1 : 0, incorrect_count: correct ? 0 : 1, total_attempts: 1,
        ease_factor: sm2Result.ease_factor, interval_days: sm2Result.interval_days,
        next_review: sm2Result.next_review, in_review_pool: sm2Result.in_review_pool,
      });
    }

    // Update streak
    const { data: streak } = await supabase
      .from('user_streaks').select('streak, last_studied').eq('user_id', session.userId).single();
    const today = new Date().toISOString().split('T')[0];

    if (!streak) {
      await supabase.from('user_streaks').insert({ user_id: session.userId, streak: 1, last_studied: today });
    } else if (streak.last_studied !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const newStreak = streak.last_studied === yesterday.toISOString().split('T')[0] ? streak.streak + 1 : 1;
      await supabase.from('user_streaks').update({ streak: newStreak, last_studied: today }).eq('user_id', session.userId);
    }

    return NextResponse.json({ message: 'Answer recorded', data: sm2Result });
  } catch (err) {
    console.error('[POST /stats/[questionId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
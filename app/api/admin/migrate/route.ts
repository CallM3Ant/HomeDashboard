import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const MIGRATION_SQL = `-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS mastered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS correct_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_correct_count INTEGER DEFAULT 0;

-- Optional: drop the user_streaks table if it still exists
-- DROP TABLE IF EXISTS user_streaks;`;

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername || session.username !== adminUsername) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Try to check if new columns exist by reading a row
    const { data, error } = await supabase
      .from('user_stats')
      .select('mastered, correct_streak, review_correct_count')
      .limit(1);

    const migrated = !error;

    return NextResponse.json({
      migrated,
      sql: MIGRATION_SQL,
      message: migrated
        ? 'Database schema is up to date.'
        : 'Migration required. Run the provided SQL in your Supabase dashboard.',
    });
  } catch (err) {
    console.error('[GET /admin/migrate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
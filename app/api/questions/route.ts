import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// ─── GET /api/questions?categoryId=xxx&includeSubcategories=true ──────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const includeSubs = searchParams.get('includeSubcategories') === 'true';
    const session = await getCurrentUser();

    const db = getDb();
    let rows: any[];

    if (!categoryId) {
      rows = db.prepare('SELECT * FROM questions ORDER BY created_at DESC').all();
    } else if (includeSubs) {
      // Get all questions in this category AND all descendant categories
      const category = db.prepare('SELECT path FROM categories WHERE id = ?').get(categoryId) as
        | { path: string }
        | undefined;

      if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

      rows = db.prepare(`
        SELECT q.* FROM questions q
        JOIN categories c ON q.category_id = c.id
        WHERE c.path = ? OR c.path LIKE ?
        ORDER BY q.created_at ASC
      `).all(category.path, `${category.path}/%`);
    } else {
      rows = db.prepare('SELECT * FROM questions WHERE category_id = ? ORDER BY created_at ASC').all(categoryId);
    }

    // If logged in, attach per-user stats
    let statsMap: Record<string, any> = {};
    if (session) {
      const stats = db.prepare(`
        SELECT question_id, correct_count, incorrect_count, total_attempts,
               ease_factor, interval_days, next_review, in_review_pool, last_answered
        FROM user_stats WHERE user_id = ?
      `).all(session.userId) as any[];

      statsMap = Object.fromEntries(stats.map((s) => [s.question_id, s]));
    }

    const questions = rows.map((q) => ({
      ...q,
      correct: JSON.parse(q.correct),
      incorrect: JSON.parse(q.incorrect),
      tags: JSON.parse(q.tags),
      stats: statsMap[q.id] ?? null,
    }));

    return NextResponse.json({ data: questions });
  } catch (err) {
    console.error('[GET /questions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/questions ───────────────────────────────────────────────────────
// Global: anyone logged in can add a question visible to all
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Must be logged in to add questions' }, { status: 401 });
    }

    const { category_id, text, type, correct, incorrect, difficulty, tags } = await req.json();

    if (!category_id || !text || !type || !correct?.length) {
      return NextResponse.json({ error: 'category_id, text, type, and at least one correct answer are required' }, { status: 400 });
    }

    if (!['single', 'multiple'].includes(type)) {
      return NextResponse.json({ error: 'type must be "single" or "multiple"' }, { status: 400 });
    }

    const db = getDb();
    const catExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
    if (!catExists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO questions (id, category_id, text, type, correct, incorrect, difficulty, tags, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, category_id, text.trim(), type,
      JSON.stringify(correct),
      JSON.stringify(incorrect ?? []),
      difficulty ?? 1,
      JSON.stringify(tags ?? []),
      session.userId
    );

    return NextResponse.json({
      data: { id, category_id, text: text.trim(), type, correct, incorrect, difficulty, tags },
      message: 'Question added',
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /questions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
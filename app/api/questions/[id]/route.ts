import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// ─── PATCH /api/questions/[id] ─────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const updates = await req.json();
    const db = getDb();

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as any;
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.text !== undefined) { fields.push('text = ?'); values.push(updates.text); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.correct !== undefined) { fields.push('correct = ?'); values.push(JSON.stringify(updates.correct)); }
    if (updates.incorrect !== undefined) { fields.push('incorrect = ?'); values.push(JSON.stringify(updates.incorrect)); }
    if (updates.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(updates.difficulty); }
    if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }

    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    values.push(id);
    db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ message: 'Question updated' });
  } catch (err) {
    console.error('[PATCH /questions/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/questions/[id] ───────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const question = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    db.prepare('DELETE FROM questions WHERE id = ?').run(id);

    return NextResponse.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('[DELETE /questions/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
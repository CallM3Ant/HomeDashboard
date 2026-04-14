import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie, validateCredentials } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const validationError = validateCredentials(username, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (username, password) VALUES (?, ?)'
    ).run(username, hashed);

    const userId = result.lastInsertRowid as number;

    // Create streak record
    db.prepare('INSERT INTO user_streaks (user_id, streak) VALUES (?, 0)').run(userId);

    const token = signToken({ userId, username });
    await setAuthCookie(token);

    return NextResponse.json({
      data: { user: { id: userId, username } },
      message: 'Account created',
    }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
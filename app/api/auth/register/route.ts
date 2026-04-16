import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signToken, setAuthCookie, validateCredentials } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const validationError = validateCredentials(username, password);
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('users').select('id').eq('username', username).single();
    if (existing)
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    const hashed = await hashPassword(password);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ username, password: hashed })
      .select('id, username')
      .single();

    if (error || !newUser) throw error;

    const token = signToken({ userId: newUser.id, username: newUser.username });
    await setAuthCookie(token);

    return NextResponse.json(
      { data: { user: { id: newUser.id, username: newUser.username } }, message: 'Account created' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
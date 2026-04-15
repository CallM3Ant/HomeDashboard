import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('username', username)
      .single();

    if (!user)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });

    const valid = await verifyPassword(password, user.password);
    if (!valid)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });

    const token = signToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({ data: { user: { id: user.id, username: user.username } }, message: 'Logged in' });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
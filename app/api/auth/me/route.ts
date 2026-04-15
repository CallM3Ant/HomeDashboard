import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await getCurrentUser();
  if (!session)
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('id, username, created_at')
    .eq('id', session.userId)
    .single();

  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ data: { user } });
}
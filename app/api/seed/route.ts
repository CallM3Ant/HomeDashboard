import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    const result = seedDatabase();
    return NextResponse.json({ data: result }, { status: result.seeded ? 201 : 200 });
  } catch (err) {
    console.error('[POST /seed]', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
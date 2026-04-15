import { NextResponse } from 'next/server';

// Seed now just calls import
export async function POST(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/import`, { method: 'POST' });
  const data = await res.json();
  return NextResponse.json(data);
}
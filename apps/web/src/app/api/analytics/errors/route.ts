import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.error('[Analytics][Error]', payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('[Analytics][Error] invalid payload', error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

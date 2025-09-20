import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.info('[Analytics][WebVitals]', payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('[Analytics][WebVitals] invalid payload', error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

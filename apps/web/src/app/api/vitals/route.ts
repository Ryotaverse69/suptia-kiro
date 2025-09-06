import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.info('[WEB-VITALS]', data);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
}

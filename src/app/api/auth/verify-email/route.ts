import { NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/services/auth.service';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await verifyEmail(token);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 400 });
  }
}

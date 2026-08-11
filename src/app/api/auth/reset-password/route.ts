import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/services/auth.service';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await resetPassword(token, password);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    // Do not log the password
    if (err.message.includes('Invalid') || err.message.includes('expired')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Error during password reset:', err.message);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/services/auth.service';
import { sendPasswordResetEmail } from '@/lib/services/email.service';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const token = await createPasswordResetToken(email);
    
    // Only send email if a user was actually found, but always return 200 to prevent enumeration
    if (token) {
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Return 200 even on error to prevent email enumeration, but log the real error server-side
    console.error('Error during password reset request:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Stub email service for PRO FITNESS OS.
 * Do not claim emails are delivered until a real provider is configured.
 */
export async function sendVerificationEmail(email: string, token: string) {
  // TODO: Implement actual email provider (e.g. Resend, Sendgrid) in future phases
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  console.log('====================================');
  console.log(`[STUB EMAIL] Verification Email to: ${email}`);
  console.log(`[STUB EMAIL] Verification Link: ${verificationLink}`);
  console.log('====================================');

  // Returning true as a stub to indicate the action completed
  return true;
}

export async function sendPasswordResetEmail(email: string, rawToken: string) {
  // TODO: Implement actual email provider (e.g. Resend, Sendgrid) in future phases
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${rawToken}`;
  
  console.log('====================================');
  console.log(`[STUB EMAIL] Password Reset Email to: ${email}`);
  console.log(`[STUB EMAIL] Reset Link: ${resetLink}`);
  console.log('====================================');

  return true;
}

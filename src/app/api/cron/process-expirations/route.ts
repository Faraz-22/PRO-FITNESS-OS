import { NextResponse } from 'next/server';
import { membershipExpiryJob } from '@/lib/jobs/tasks/membership-expiry.job';

export async function GET(request: Request) {
  try {
    await membershipExpiryJob.execute();
    return NextResponse.json({ success: true, message: 'Membership expirations processed successfully.' });
  } catch (error: any) {
    console.error('Error processing membership expirations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

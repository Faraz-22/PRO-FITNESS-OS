import { NextResponse } from 'next/server';
import { processAllAutoResumes } from '@/lib/services/membership-cron.service';

// Allow Vercel Cron or other external cron jobs to hit this endpoint
export async function GET(request: Request) {
  try {
    // Optional: Add authorization header check here if needed to secure the cron
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    const result = await processAllAutoResumes();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error processing auto resumes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

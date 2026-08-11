'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setErrorMessage('Missing verification token.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
        } else {
          const data = await res.json();
          setStatus('error');
          setErrorMessage(data.error || 'Failed to verify email.');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Network error occurred.');
      });
  }, [token]);

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl text-center">
      <CardHeader>
        <CardTitle className="text-2xl text-zinc-100">Email Verification</CardTitle>
        <CardDescription className="text-zinc-400">
          Verifying your account details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-zinc-400">Please wait while we verify your email...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-zinc-200">Your email has been verified successfully!</p>
            <Button onClick={() => router.push('/auth/login')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              Continue to Login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-red-400">{errorMessage}</p>
            <Button onClick={() => router.push('/auth/login')} variant="outline" className="mt-4 border-zinc-700 text-zinc-300">
              Return to Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-8">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

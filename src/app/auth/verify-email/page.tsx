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
    <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl text-center">
      <CardHeader className="space-y-2 pb-8">
        <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
          <div className="w-6 h-6 border-2 border-primary rounded-sm transform rotate-45"></div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Email Verification</CardTitle>
        <CardDescription className="text-muted-foreground">
          Verifying your account details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Please wait while we verify your email...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-12 w-12 text-success" />
            <p className="text-foreground font-medium">Your email has been verified successfully!</p>
            <Button onClick={() => router.push('/auth/login')} className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 font-medium">
              Continue to Login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="h-12 w-12 text-danger" />
            <p className="text-danger font-medium">{errorMessage}</p>
            <Button onClick={() => router.push('/auth/login')} variant="outline" className="mt-4 border-border text-foreground hover:bg-secondary h-11 px-8">
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
    <Suspense fallback={<div className="text-foreground text-center p-8">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

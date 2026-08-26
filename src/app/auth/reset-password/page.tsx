'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
        <CardContent className="pt-8 text-center text-danger font-medium">
          Invalid or missing reset token.
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setStatus('idle');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      setStatus('success');
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage((err as Error).message);
    }
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-8">
        <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
          <div className="w-6 h-6 border-2 border-primary rounded-sm transform rotate-45"></div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Set New Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Please enter your new password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          {status === 'success' && (
            <div className="rounded-md bg-success/10 p-3 text-sm text-success border border-success/20 font-medium text-center">
              Password has been successfully reset! Redirecting to login...
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger border border-danger/20 font-medium text-center">
              {errorMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">New Password</Label>
            <Input
              id="password"
              type="password"
              className="bg-background/50 border-border/50 text-foreground focus-visible:ring-primary h-11"
              disabled={isSubmitting || status === 'success'}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-danger font-medium">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="bg-background/50 border-border/50 text-foreground focus-visible:ring-primary h-11"
              disabled={isSubmitting || status === 'success'}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-danger font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-medium text-base"
            disabled={isSubmitting || status === 'success'}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Reset Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-foreground text-center p-8">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

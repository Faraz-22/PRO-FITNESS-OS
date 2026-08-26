'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setStatus('idle');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Something went wrong. Please try again.');
      }

      setStatus('success');
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
        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Reset Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          {status === 'success' && (
            <div className="rounded-md bg-success/10 p-3 text-sm text-success border border-success/20 font-medium text-center">
              If an account with that email exists, we sent a password reset link.
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-md bg-danger/10 p-3 text-sm text-danger border border-danger/20 font-medium text-center">
              {errorMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="bg-background/50 border-border/50 text-foreground focus-visible:ring-primary h-11"
              disabled={isSubmitting || status === 'success'}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-danger font-medium">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-medium text-base"
            disabled={isSubmitting || status === 'success'}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Send Reset Link
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

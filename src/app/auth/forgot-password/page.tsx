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
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-zinc-100">Reset Password</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500 border border-green-500/20">
              If an account with that email exists, we sent a password reset link.
            </div>
          )}
          {status === 'error' && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {errorMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="bg-zinc-950/50 border-zinc-800 text-zinc-100"
              disabled={isSubmitting || status === 'success'}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={isSubmitting || status === 'success'}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Send Reset Link
          </Button>
          <div className="text-center text-sm text-zinc-400">
            Remember your password?{' '}
            <a href="/auth/login" className="text-blue-500 hover:text-blue-400 font-medium">
              Sign in
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

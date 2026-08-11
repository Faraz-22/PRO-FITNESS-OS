'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please check your email and password.');
        return;
      }

      router.push('/');
      router.refresh(); // Ensure the layout updates with auth state
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-zinc-100">Welcome Back</CardTitle>
        <CardDescription className="text-zinc-400">
          Sign in to your Pro Fitness account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="bg-zinc-950/50 border-zinc-800 text-zinc-100"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              className="bg-zinc-950/50 border-zinc-800 text-zinc-100"
              disabled={isSubmitting}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sign In
          </Button>
          <div className="text-center text-sm text-zinc-400">
            Don&apos;t have an account?{' '}
            <a href="/auth/register" className="text-blue-500 hover:text-blue-400 font-medium">
              Register now
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

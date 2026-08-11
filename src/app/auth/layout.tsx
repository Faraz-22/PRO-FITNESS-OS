import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase italic">
            PRO FITNESS OS
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Access your account and manage your fitness journey
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

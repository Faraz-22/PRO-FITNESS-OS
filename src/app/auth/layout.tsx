import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium dark gradient background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground uppercase italic drop-shadow-md">
            PRO FITNESS <span className="text-primary font-light text-3xl">OS</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground font-medium">
            Access your account and manage your fitness journey
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

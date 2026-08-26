import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <Activity className="h-12 w-12 text-emerald-500 animate-pulse" />
        <div className="absolute w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
      </div>
      <p className="mt-8 text-zinc-400 font-medium tracking-wide animate-pulse">LOADING FITNESS DATA...</p>
    </div>
  );
}

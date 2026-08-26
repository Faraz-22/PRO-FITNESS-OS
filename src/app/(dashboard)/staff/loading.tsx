import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50/50 rounded-xl m-8 border border-gray-100">
      <div className="relative flex items-center justify-center">
        <Activity className="h-10 w-10 text-blue-600 animate-pulse" />
        <div className="absolute w-20 h-20 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin" />
      </div>
      <p className="mt-6 text-gray-500 font-medium tracking-wide animate-pulse">LOADING WORKSPACE...</p>
    </div>
  );
}

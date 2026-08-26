'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PrintAction({ backUrl }: { backUrl: string }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Auto print when the page loads
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed top-4 left-4 flex gap-2 print:hidden z-50 bg-white/80 p-2 rounded-lg backdrop-blur shadow-sm">
      <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-2" />
        Print Ticket
      </Button>
    </div>
  );
}

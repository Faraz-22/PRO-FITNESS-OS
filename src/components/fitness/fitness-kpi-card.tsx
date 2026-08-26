import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function FitnessKpiCard({
  title,
  value,
  description,
  icon: Icon
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ElementType;
}) {
  return (
    <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-zinc-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

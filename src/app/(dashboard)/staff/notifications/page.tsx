import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notifications Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This module is currently under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

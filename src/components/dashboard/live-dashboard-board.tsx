'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, MessageCircle, Phone, RefreshCw, UserPlus } from 'lucide-react';
import type { ExecutiveDashboardMetrics } from '@/lib/services/dashboard.service';
import { LiveMetricCards } from './live-metric-cards';
import { DashboardCharts } from './dashboard-charts';

interface LiveDashboardBoardProps {
  initialMetrics: ExecutiveDashboardMetrics;
}

export function LiveDashboardBoard({ initialMetrics }: LiveDashboardBoardProps) {
  const [metrics, setMetrics] = useState<ExecutiveDashboardMetrics>(initialMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLatestMetrics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/staff/dashboard', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) return;
      const latest = (await response.json()) as ExecutiveDashboardMetrics;
      setMetrics(latest);
    } catch {
      // Keep previous metrics visible on transient network error
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchLatestMetrics();
      }
    }, 15000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void fetchLatestMetrics();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [fetchLatestMetrics]);

  const {
    activeMembers,
    todayAttendance,
    activeLeads,
    monthlyRevenueTotal,
    monthlyPaymentCount,
    todayRevenueTotal,
    currentMonthRevenue,
    genderDistribution,
    retentionStats,
    expiringMemberships,
    activeSessions,
    lastUpdatedIso,
    timezone,
  } = metrics;

  const formattedLastSync = new Date(lastUpdatedIso).toLocaleTimeString('en-IN', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Executive Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">Command center for your branch.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Synced at {formattedLastSync}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchLatestMetrics()}
            disabled={isRefreshing}
            className="gap-1.5 border-border/60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <LiveMetricCards activeMembers={activeMembers} todayAttendance={todayAttendance} />

        <Link href="/staff/crm" className="block transition-transform active:scale-95">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
              <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-semibold text-foreground">{activeLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">In CRM pipeline</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/staff/finance" className="block transition-transform active:scale-95">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/50 transition-colors h-full cursor-pointer relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Monthly Revenue
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live update active"></span>
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-semibold text-foreground">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(monthlyRevenueTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlyPaymentCount} payments •{' '}
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(todayRevenueTotal)}{' '}
                today
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <DashboardCharts
        currentMonthRevenue={currentMonthRevenue}
        monthlyRevenueTotal={monthlyRevenueTotal}
        monthlyPaymentCount={monthlyPaymentCount}
        genderDistribution={genderDistribution}
        retentionStats={retentionStats}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Expiring Memberships (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringMemberships.map((ms) => (
                <div key={ms.id} className="flex justify-between items-center group">
                  <div>
                    <Link
                      href={`/staff/members/${ms.memberId}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {ms.memberName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{ms.planName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 transition-opacity">
                      {ms.phone && (
                        <>
                          <a
                            href={`tel:${ms.phone}`}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors"
                            title="Call Member"
                          >
                            <Phone className="h-3.5 w-3.5 text-blue-500" />
                          </a>
                          <a
                            href={`https://wa.me/${ms.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors"
                            title="WhatsApp Message"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                          </a>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-warning font-medium">{ms.endDateFormatted}</p>
                    </div>
                  </div>
                </div>
              ))}
              {expiringMemberships.length === 0 && (
                <p className="text-sm text-muted-foreground">No memberships expiring soon.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Active Sessions (Checked In Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex justify-between items-center group">
                  <div>
                    <Link
                      href={`/staff/members/${session.memberId}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {session.memberName}
                    </Link>
                    <p className="text-xs text-muted-foreground">Checked in via {session.method}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 transition-opacity">
                      {session.phone && (
                        <>
                          <a
                            href={`tel:${session.phone}`}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors"
                            title="Call Member"
                          >
                            <Phone className="h-3.5 w-3.5 text-blue-500" />
                          </a>
                          <a
                            href={`https://wa.me/${session.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors"
                            title="WhatsApp Message"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                          </a>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{session.checkInTimeFormatted}</p>
                    </div>
                  </div>
                </div>
              ))}
              {activeSessions.length === 0 && (
                <p className="text-sm text-muted-foreground">No active sessions.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


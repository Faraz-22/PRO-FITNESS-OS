'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ChartProps {
  currentMonthRevenue: { date: string; amount: number }[];
  monthlyRevenueTotal: number;
  monthlyPaymentCount: number;
  genderDistribution: { name: string; value: number }[];
  retentionStats: { name: string; value: number }[];
}

const GENDER_COLORS: Record<string, string> = {
  Female: '#ec4899',
  Male: '#3b82f6',
  Other: '#9ca3af',
  'Not specified': '#9ca3af',
};

const RETENTION_COLORS: Record<string, string> = {
  Retained: '#22c55e',
  'Not Renewed': '#ef4444',
};

function formatDateLabel(dateKey: string): string {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateKey;
  const [year, month, day] = parts;
  return new Date(Date.UTC(year!, month! - 1, day!)).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function DashboardCharts({
  currentMonthRevenue,
  monthlyRevenueTotal,
  monthlyPaymentCount,
  genderDistribution,
  retentionStats,
}: ChartProps) {
  const formattedRevenue = currentMonthRevenue.map((item) => ({
    ...item,
    displayDate: formatDateLabel(item.date),
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Revenue Chart */}
      <Card className="col-span-4 border-border/50 bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              Monthly Revenue Tracker
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-500 border border-green-500/20"
                title="Live graph tracking active"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyPaymentCount > 0
                ? `${monthlyPaymentCount} successful payment${monthlyPaymentCount === 1 ? '' : 's'} this month`
                : 'No payments recorded yet this month'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-foreground">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                monthlyRevenueTotal
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Month-to-date</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {formattedRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value) => [
                      new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(Number(value ?? 0)),
                      'Revenue',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No revenue recorded this month.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pie Charts */}
      <div className="col-span-3 flex flex-col gap-6">
        <Card className="border-border/50 bg-card/50 shadow-sm flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Client Demographics (Gender)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              {genderDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No demographic data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Retention (Current Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around items-center h-[80px]">
              {retentionStats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold" style={{ color: RETENTION_COLORS[stat.name] }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

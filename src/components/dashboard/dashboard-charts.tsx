'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';

interface ChartProps {
  currentMonthRevenue: { date: string; amount: number }[];
  genderDistribution: { name: string; value: number }[];
  retentionStats: { name: string; value: number }[];
}

const GENDER_COLORS: Record<string, string> = {
  Female: '#ec4899', // Pink
  Male: '#3b82f6',   // Blue
  Other: '#9ca3af',  // Gray
};

const RETENTION_COLORS: Record<string, string> = {
  'Retained': '#22c55e',    // Green
  'Not Renewed': '#ef4444', // Red
};

export function DashboardCharts({ currentMonthRevenue, genderDistribution, retentionStats }: ChartProps) {
  // Format dates for X-axis (e.g., '2026-08-01' -> 'Aug 01')
  const formattedRevenue = currentMonthRevenue.map(item => {
    const d = new Date(item.date);
    return {
      ...item,
      displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Revenue Chart */}
      <Card className="col-span-4 border-border/50 bg-card/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Monthly Revenue Tracker</CardTitle>
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
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#ef4444" 
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
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
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

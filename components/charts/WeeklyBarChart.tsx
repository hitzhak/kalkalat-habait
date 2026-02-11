'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface WeeklyData {
  week: number;
  amount: number;
}

interface WeeklyBarChartProps {
  data: WeeklyData[];
  averageWeeklyBudget?: number; // ממוצע שבועי רצוי (תקציב משתנות / 4.5)
}

export function WeeklyBarChart({ data, averageWeeklyBudget }: WeeklyBarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">הוצאות משתנות לפי שבוע</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-500">
            אין נתוני הוצאות שבועיות להצגה
          </div>
        </CardContent>
      </Card>
    );
  }

  // יצירת נתונים מלאים לכל 5 השבועות
  const fullWeekData = [1, 2, 3, 4, 5].map((weekNum) => {
    const existing = data.find((d) => d.week === weekNum);
    return {
      week: weekNum,
      amount: existing?.amount || 0,
      weekLabel: `שבוע ${weekNum}`,
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ 
    active, 
    payload 
  }: { 
    active?: boolean; 
    payload?: Array<{ 
      payload: { weekLabel: string }; 
      value: number 
    }> 
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.payload.weekLabel}</p>
          <p className="text-sm text-cyan-600 font-medium">
            {formatCurrency(data.value)}
          </p>
          {averageWeeklyBudget && (
            <p className="text-xs text-slate-500 mt-1">
              ממוצע: {formatCurrency(averageWeeklyBudget)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // קביעת גובה מקסימלי לציר Y
  const maxAmount = Math.max(...fullWeekData.map((d) => d.amount));
  const yAxisMax = averageWeeklyBudget
    ? Math.max(maxAmount, averageWeeklyBudget) * 1.2
    : maxAmount * 1.2;

  return (
    <Card className="bg-white rounded-xl shadow-sm animate-in fade-in duration-300 delay-[400ms] hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">הוצאות משתנות לפי שבוע</CardTitle>
        {averageWeeklyBudget && (
          <p className="text-sm text-slate-500 mt-1">
            ממוצע שבועי רצוי: {formatCurrency(averageWeeklyBudget)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-64" dir="rtl">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fullWeekData}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fill: '#64748b', fontSize: 12 }}
                reversed={true} // RTL
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                domain={[0, yAxisMax]}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* קו ממוצע שבועי רצוי (מקווקו) */}
              {averageWeeklyBudget && (
                <ReferenceLine
                  y={averageWeeklyBudget}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: 'ממוצע רצוי',
                    position: 'insideTopRight',
                    fill: '#f59e0b',
                    fontSize: 11,
                  }}
                />
              )}
              
              <Bar
                dataKey="amount"
                fill="#0891B2"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
                animationBegin={0}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

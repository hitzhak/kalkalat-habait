'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  totalAmount: number;
}

interface ExpensePieChartProps {
  data: CategoryExpense[];
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0 || data.every((item) => item.totalAmount === 0)) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">הוצאות לפי קטגוריה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-500">
            אין נתוני הוצאות להצגה
          </div>
        </CardContent>
      </Card>
    );
  }

  // מיון קטגוריות לפי סכום (גדול לקטן)
  const sortedData = [...data].sort((a, b) => b.totalAmount - a.totalAmount);

  // לקיחת 6 הגדולות ביותר + קבוצת "אחר"
  const topCategories = sortedData.slice(0, 6);
  const otherCategories = sortedData.slice(6);

  let chartData = topCategories.map((item) => ({
    name: item.categoryName,
    value: item.totalAmount,
    color: item.categoryColor || '#64748b',
  }));

  // הוספת "אחר" אם יש קטגוריות נוספות
  if (otherCategories.length > 0) {
    const otherTotal = otherCategories.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    chartData.push({
      name: 'אחר',
      value: otherTotal,
      color: '#94A3B8', // slate-400
    });
  }

  // חישוב סה"כ
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">
            {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-slate-500">{percent}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom label
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm animate-in fade-in duration-300 delay-300 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">הוצאות לפי קטגוריה</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" dir="rtl">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-slate-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { Wallet, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface BudgetCategoryData {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  plannedAmount: number;
  actualSpent: number;
  remaining: number;
  usagePercent: number;
  alertLevel: 'success' | 'warning' | 'danger' | 'error';
}

interface RemainingBudgetProps {
  categories: BudgetCategoryData[];
  totalRemaining: number;
  totalBudget: number;
  totalSpent: number;
}

function getBarColor(alertLevel: string) {
  switch (alertLevel) {
    case 'success': return 'bg-emerald-500';
    case 'warning': return 'bg-yellow-500';
    case 'danger': return 'bg-orange-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
}

function getRemainingTextColor(remaining: number, usagePercent: number) {
  if (remaining < 0 || usagePercent >= 100) return 'text-red-600';
  if (usagePercent >= 90) return 'text-orange-600';
  if (usagePercent >= 70) return 'text-yellow-600';
  return 'text-emerald-600';
}

export function RemainingBudget({ categories, totalRemaining, totalBudget, totalSpent }: RemainingBudgetProps) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">לא הוגדר תקציב עדיין</p>
          <p className="text-sm text-slate-400 mt-1">הגדר תקציב חודשי כדי לעקוב אחר ההוצאות</p>
          <Link
            href="/budget"
            className="inline-block mt-4 text-sm font-medium text-cyan-600 hover:text-cyan-700"
          >
            הגדר תקציב &larr;
          </Link>
        </CardContent>
      </Card>
    );
  }

  const totalUsagePercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overallColor = totalRemaining < 0 ? 'text-red-600' : 'text-emerald-600';
  const overallBg = totalRemaining < 0 ? 'bg-red-50' : 'bg-emerald-50';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wallet className="h-5 w-5 text-cyan-600" />
            כמה נשאר להוציא?
          </CardTitle>
          <Link
            href="/budget"
            className="text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-0.5"
          >
            לתקציב המלא
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall remaining */}
        <div className={`rounded-lg p-3 ${overallBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">סה&quot;כ נותר מהתקציב</span>
            <span className={`text-xl font-bold ${overallColor}`}>
              {formatCurrency(totalRemaining)}
            </span>
          </div>
          <Progress
            value={Math.min(totalUsagePercent, 100)}
            className="h-2 mt-2"
            indicatorClassName={totalUsagePercent >= 100 ? 'bg-red-500' : totalUsagePercent >= 80 ? 'bg-orange-500' : 'bg-emerald-500'}
          />
          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>הוצאת {formatCurrency(totalSpent)}</span>
            <span>מתוך {formatCurrency(totalBudget)}</span>
          </div>
        </div>

        {/* Per-category list */}
        <div className="space-y-1">
          {categories
            .filter(c => c.plannedAmount > 0)
            .sort((a, b) => a.remaining - b.remaining)
            .map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 py-1.5 px-1">
              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color || '#0891B2' }}
              />
              {/* Name */}
              <span className="text-sm truncate flex-1 min-w-0">{cat.name}</span>
              {/* Progress mini bar */}
              <div className="w-16 sm:w-24 shrink-0">
                <Progress
                  value={Math.min(cat.usagePercent, 100)}
                  className="h-1.5"
                  indicatorClassName={getBarColor(cat.alertLevel)}
                />
              </div>
              {/* Remaining amount */}
              <span className={`text-sm font-bold shrink-0 tabular-nums ${getRemainingTextColor(cat.remaining, cat.usagePercent)}`}>
                {formatCurrency(cat.remaining)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

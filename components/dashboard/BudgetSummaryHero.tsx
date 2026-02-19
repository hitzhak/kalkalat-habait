'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { getBudgetColor, getBudgetTailwindBg } from '@/lib/colors';
import { Wallet } from 'lucide-react';

interface BudgetSummaryHeroProps {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  utilizationPercent: number;
}

export function BudgetSummaryHero({
  totalBudget,
  totalSpent,
  remaining,
  utilizationPercent,
}: BudgetSummaryHeroProps) {
  const clampedPercent = Math.min(utilizationPercent, 100);
  const isOverBudget = remaining < 0;
  const barColorClass = getBudgetTailwindBg(utilizationPercent);
  const remainingColor = isOverBudget ? 'text-expense-500' : 'text-income-500';
  const bgColor = isOverBudget ? 'bg-red-50' : 'bg-emerald-50/50';

  return (
    <Card className={`${bgColor} border-0 shadow-md`}>
      <CardContent className="py-6 px-5">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {isOverBudget ? 'חריגה מהתקציב' : 'נשאר להוציא החודש'}
            </span>
          </div>

          <div className={`hero-number text-4xl sm:text-5xl font-bold tracking-tight ${remainingColor}`}>
            {isOverBudget ? '-' : ''}{formatCurrency(Math.abs(remaining))}
          </div>

          <Progress
            value={clampedPercent}
            className="h-3 mx-auto max-w-md"
            indicatorClassName={barColorClass}
          />

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>מתוך {formatCurrency(totalBudget)}</span>
            <span>·</span>
            <span>ניצלת {formatPercent(utilizationPercent)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

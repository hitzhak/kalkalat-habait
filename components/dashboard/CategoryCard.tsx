'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { getBudgetTailwindBg } from '@/lib/colors';
import * as Icons from 'lucide-react';

export interface BudgetCategoryData {
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

interface CategoryCardProps {
  category: BudgetCategoryData;
  onClick?: (category: BudgetCategoryData) => void;
}

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return null;
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  if (!IconComponent) return null;
  return <IconComponent className="h-5 w-5" />;
}

function getRemainingColor(remaining: number, usagePercent: number) {
  if (remaining < 0 || usagePercent >= 100) return 'text-red-600';
  if (usagePercent >= 85) return 'text-yellow-600';
  return 'text-emerald-600';
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const { name, icon, plannedAmount, remaining, usagePercent } = category;
  const barColorClass = getBudgetTailwindBg(usagePercent);
  const remainingTextColor = getRemainingColor(remaining, usagePercent);
  const IconEl = getCategoryIcon(icon);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] bg-white"
      onClick={() => onClick?.(category)}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          {IconEl && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: (category.color || '#0891B2') + '20', color: category.color || '#0891B2' }}
            >
              {IconEl}
            </div>
          )}
          <span className="text-sm font-medium text-slate-700 truncate">{name}</span>
        </div>

        <div className={`text-lg font-bold ${remainingTextColor}`}>
          {formatCurrency(remaining)}
        </div>

        <Progress
          value={Math.min(usagePercent, 100)}
          className="h-1.5"
          indicatorClassName={barColorClass}
        />

        <div className="text-[11px] text-slate-400">
          מתוך {formatCurrency(plannedAmount)}
        </div>
      </CardContent>
    </Card>
  );
}

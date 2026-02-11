import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface CategoryAlert {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  budgetAmount: number;
  spentAmount: number;
  usagePercent: number;
}

interface BudgetAlertsProps {
  alerts: CategoryAlert[];
}

export function BudgetAlerts({ alerts }: BudgetAlertsProps) {
  // סינון התראות רק לקטגוריות שחרגו מ-80%
  const criticalAlerts = alerts.filter((alert) => alert.usagePercent >= 80);

  // אם אין התראות - לא מציגים כלום
  if (criticalAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-50 border-amber-200 rounded-xl shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-amber-900">התראות תקציב</h3>
            <div className="space-y-2">
              {criticalAlerts.map((alert) => {
                // קביעת צבע לפי רמת החומרה
                let alertColor = 'text-amber-700'; // 80-95%
                let bgColor = 'bg-amber-100';

                if (alert.usagePercent >= 100) {
                  alertColor = 'text-red-700';
                  bgColor = 'bg-red-100';
                } else if (alert.usagePercent >= 95) {
                  alertColor = 'text-orange-700';
                  bgColor = 'bg-orange-100';
                }

                return (
                  <div
                    key={alert.categoryId}
                    className={`${bgColor} rounded-lg p-3 flex items-center justify-between`}
                  >
                    <div className="flex-1">
                      <p className={`font-medium ${alertColor}`}>
                        {alert.categoryName}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatCurrency(alert.spentAmount)} מתוך{' '}
                        {formatCurrency(alert.budgetAmount)}
                      </p>
                    </div>
                    <div className="text-left">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-sm font-bold ${alertColor}`}
                      >
                        {formatPercent(alert.usagePercent)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-amber-700">
              הקטגוריות המוצגות חרגו מ-80% מהתקציב החודשי
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

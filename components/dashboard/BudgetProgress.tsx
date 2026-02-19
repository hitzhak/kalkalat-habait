import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { differenceInDays, endOfMonth } from 'date-fns';
import Link from 'next/link';

interface BudgetProgressProps {
  totalBudget: number;
  totalSpent: number;
  month: number;
  year: number;
}

export function BudgetProgress({
  totalBudget,
  totalSpent,
  month,
  year,
}: BudgetProgressProps) {
  // אם אין תקציב מוגדר
  if (totalBudget === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">ניצול תקציב חודשי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">לא הוגדר תקציב חודשי</p>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              הגדר תקציב עכשיו
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // חישוב אחוז ניצול
  const usagePercent = (totalSpent / totalBudget) * 100;
  const remaining = totalBudget - totalSpent;

  // חישוב ימים נותרים עד סוף החודש
  const today = new Date();
  const lastDayOfMonth = endOfMonth(new Date(year, month - 1));
  const daysRemaining = differenceInDays(lastDayOfMonth, today);

  // קביעת צבע הפס לפי אחוז ניצול
  let progressColor = 'bg-income-500'; // 0-70%
  if (usagePercent >= 100) {
    progressColor = 'bg-expense-500'; // 100%+
  } else if (usagePercent >= 90) {
    progressColor = 'bg-warning-500'; // 90-100%
  } else if (usagePercent >= 70) {
    progressColor = 'bg-warning-500'; // 70-90%
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm animate-in fade-in duration-300 delay-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">ניצול תקציב חודשי</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* פס התקדמות */}
        <div className="space-y-2">
          <div className="relative">
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            {usagePercent > 100 && (
              <div className="absolute top-0 right-0 -mt-1 -mr-1">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-expense-500"></span>
                </span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-foreground">
              {Math.round(usagePercent)}%
            </span>
            {usagePercent >= 100 && (
              <span className="text-expense-500 font-medium">חריגה מתקציב!</span>
            )}
          </div>
        </div>

        {/* סכומים */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">נוצל</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">מתוך</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground">נותר</p>
            <p
              className={`text-lg font-bold ${
                remaining >= 0 ? 'text-income-500' : 'text-expense-500'
              }`}
            >
              {formatCurrency(Math.abs(remaining))}
            </p>
          </div>
        </div>

        {/* ימים נותרים */}
        {daysRemaining >= 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              {remaining >= 0 ? (
                <>
                  נותרו <span className="font-bold">{formatCurrency(remaining)}</span> ל-
                  <span className="font-bold">{daysRemaining}</span> ימים
                </>
              ) : (
                <>
                  חריגה של <span className="font-bold text-expense-500">{formatCurrency(Math.abs(remaining))}</span>
                </>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

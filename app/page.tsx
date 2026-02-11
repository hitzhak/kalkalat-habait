import { Suspense } from 'react';
import { getTransactionsSummary, getTransactions } from './actions/transactions';
import {
  getExpensesByCategory,
  getWeeklyVariableExpenses,
  getBudgetAlerts,
  getTotalBudgetSummary,
  getPreviousMonthSummary,
} from './actions/dashboard';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { DbConnectionError } from '@/components/DbConnectionError';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

// פונקציה לקבלת החודש והשנה הנוכחיים
function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

// Loading skeletons
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Budget progress skeleton */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      {/* Recent transactions skeleton */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
          <Plus className="w-12 h-12 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">
            אין נתונים עדיין
          </h2>
          <p className="text-slate-600">
            התחל בהוספת העסקה הראשונה שלך כדי לראות את הדשבורד מתעדכן
          </p>
        </div>
        <Link
          href="/transactions"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-base font-medium text-white hover:bg-cyan-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          הוסף עסקה ראשונה
        </Link>
      </div>
    </div>
  );
}

// Main dashboard content component
async function DashboardContent({ month, year }: { month: number; year: number }) {
  try {
    // קריאות לכל ה-Server Actions במקביל
    const [
      summary,
      previousSummary,
      transactionsResult,
      expensesByCategory,
      weeklyExpenses,
      budgetSummary,
      alerts,
    ] = await Promise.all([
      getTransactionsSummary(month, year),
      getPreviousMonthSummary(month, year),
      getTransactions(month, year),
      getExpensesByCategory(month, year),
      getWeeklyVariableExpenses(month, year),
      getTotalBudgetSummary(month, year),
      getBudgetAlerts(month, year),
    ]);

    // חילוץ רשימת העסקאות מהתוצאה
    const transactions = transactionsResult.transactions || [];
    const recurringGenerated = transactionsResult.recurringGenerated;

    // בדיקה אם יש נתונים
    const hasData =
      transactions.length > 0 ||
      summary.totalIncome > 0 ||
      summary.totalExpenses > 0;

    if (!hasData) {
      return <EmptyState />;
    }

  // חישוב ממוצע שבועי רצוי (תקציב משתנות / 4.5)
  // נניח שתקציב משתנות הוא 60% מהתקציב הכולל (זו הנחה - אפשר לשפר)
  const estimatedVariableBudget = budgetSummary.totalBudget * 0.6;
  const averageWeeklyBudget = estimatedVariableBudget / 4.5;

  // שמות חודשים בעברית
  const monthNames = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
  ];

  return (
    <div className="space-y-6">
      {/* באנר עסקאות חוזרות (אם נוצרו) */}
      {recurringGenerated && recurringGenerated.count > 0 && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                <svg
                  className="h-5 w-5 text-cyan-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-cyan-900">
                  נוצרו {recurringGenerated.count} עסקאות חוזרות לחודש {monthNames[month - 1]}
                </p>
                <p className="text-sm text-cyan-700">
                  העסקאות נוצרו אוטומטית מהחודש הקודם
                </p>
              </div>
            </div>
            <Link
              href="/transactions"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
            >
              צפה
            </Link>
          </div>
        </div>
      )}

      {/* כרטיסי סיכום */}
      <SummaryCards
        totalIncome={summary.totalIncome}
        totalExpenses={summary.totalExpenses}
        balance={summary.balance}
        previousMonthIncome={previousSummary.totalIncome}
        previousMonthExpenses={previousSummary.totalExpenses}
        previousMonthBalance={previousSummary.balance}
      />

      {/* פס התקדמות תקציב */}
      <BudgetProgress
        totalBudget={budgetSummary.totalBudget}
        totalSpent={budgetSummary.totalSpent}
        month={month}
        year={year}
      />

      {/* התראות תקציב (אם יש) */}
      {alerts.length > 0 && <BudgetAlerts alerts={alerts} />}

      {/* גרפים - שורה עם 2 עמודות */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpensePieChart data={expensesByCategory} />
        <WeeklyBarChart
          data={weeklyExpenses}
          averageWeeklyBudget={averageWeeklyBudget}
        />
      </div>

      {/* עסקאות אחרונות */}
      <RecentTransactions transactions={transactions} />
    </div>
  );
  } catch {
    return <DbConnectionError />;
  }
}

// Main page component
export default function DashboardPage() {
  const { month, year } = getCurrentMonthYear();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            דשבורד ראשי
          </h1>
          <p className="text-slate-600 mt-1">
            סקירה כללית של המצב הפיננסי שלך
          </p>
        </div>
      </div>

      {/* Main content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent month={month} year={year} />
      </Suspense>
    </div>
  );
}

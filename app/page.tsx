'use client';

import { useEffect, useState } from 'react';
import { getDashboardData } from './actions/dashboard';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { WeeklyBarChart } from '@/components/charts/WeeklyBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { DbConnectionError } from '@/components/DbConnectionError';
import { useAppStore } from '@/stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, ArrowDown, ArrowLeft, Wallet } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

// Interface for dashboard data (from unified getDashboardData)
type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

// Main dashboard content component
function DashboardContent({ month, year }: { month: number; year: number }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      
      try {
        // קריאה מאוחדת אחת - 7 round-trips הפכו ל-1
        const data = await getDashboardData(month, year);
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('שגיאה בטעינת הנתונים'));
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [month, year]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DbConnectionError />;
  }

  if (!dashboardData) {
    return <EmptyState />;
  }

  // חילוץ רשימת העסקאות מהתוצאה
  const transactions = dashboardData.transactionsResult.transactions || [];
  const recurringGenerated = dashboardData.transactionsResult.recurringGenerated;

  // בדיקה אם יש נתונים
  const hasData =
    transactions.length > 0 ||
    dashboardData.summary.totalIncome > 0 ||
    dashboardData.summary.totalExpenses > 0;

  if (!hasData) {
    return <EmptyState />;
  }

  // חישוב ממוצע שבועי מתוך נתוני זרימת תקציב אמיתיים
  const availableForVariable = dashboardData.budgetFlow.availableForVariable;
  const averageWeeklyBudget = availableForVariable > 0 ? availableForVariable / 4.5 : 0;

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
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm animate-fade-in-up">
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
      <div className="animate-fade-in-up animate-delay-1">
      <SummaryCards
        totalIncome={dashboardData.summary.totalIncome}
        totalExpenses={dashboardData.summary.totalExpenses}
        balance={dashboardData.summary.balance}
        previousMonthIncome={dashboardData.previousSummary.totalIncome}
        previousMonthExpenses={dashboardData.previousSummary.totalExpenses}
        previousMonthBalance={dashboardData.previousSummary.balance}
      />
      </div>

      {/* פס התקדמות תקציב */}
      <div className="animate-fade-in-up animate-delay-2">
      <BudgetProgress
        totalBudget={dashboardData.budgetSummary.totalBudget}
        totalSpent={dashboardData.budgetSummary.totalSpent}
        month={month}
        year={year}
      />
      </div>

      {/* זרימת תקציב — הכנסות → קבועות → נותר למשתנות */}
      {dashboardData.budgetFlow.totalIncome > 0 && (
        <Card className="animate-fade-in-up animate-delay-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-cyan-600" />
              זרימת תקציב חודשי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 text-center">
              {/* הכנסות */}
              <div className="flex-1 rounded-lg bg-emerald-50 p-3">
                <div className="text-xs text-emerald-600 font-medium">הכנסות</div>
                <div className="text-lg font-bold text-emerald-700">
                  {formatCurrency(dashboardData.budgetFlow.totalIncome)}
                </div>
              </div>
              <ArrowLeft className="hidden sm:block h-5 w-5 text-slate-400 mx-1 shrink-0" />
              <ArrowDown className="sm:hidden h-5 w-5 text-slate-400 mx-auto shrink-0" />
              {/* קבועות */}
              <div className="flex-1 rounded-lg bg-orange-50 p-3">
                <div className="text-xs text-orange-600 font-medium">
                  קבועות (ב-{dashboardData.budgetFlow.payday} לחודש)
                </div>
                <div className="text-lg font-bold text-orange-700">
                  -{formatCurrency(dashboardData.budgetFlow.fixedExpenses)}
                </div>
              </div>
              <ArrowLeft className="hidden sm:block h-5 w-5 text-slate-400 mx-1 shrink-0" />
              <ArrowDown className="sm:hidden h-5 w-5 text-slate-400 mx-auto shrink-0" />
              {/* נותר למשתנות */}
              <div className="flex-1 rounded-lg bg-blue-50 p-3">
                <div className="text-xs text-blue-600 font-medium">נותר למשתנות</div>
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(dashboardData.budgetFlow.availableForVariable)}
                </div>
              </div>
              <ArrowLeft className="hidden sm:block h-5 w-5 text-slate-400 mx-1 shrink-0" />
              <ArrowDown className="sm:hidden h-5 w-5 text-slate-400 mx-auto shrink-0" />
              {/* הוצאות משתנות בפועל */}
              <div className="flex-1 rounded-lg bg-red-50 p-3">
                <div className="text-xs text-red-600 font-medium">משתנות בפועל</div>
                <div className="text-lg font-bold text-red-700">
                  -{formatCurrency(dashboardData.budgetFlow.variableExpenses)}
                </div>
              </div>
              <ArrowLeft className="hidden sm:block h-5 w-5 text-slate-400 mx-1 shrink-0" />
              <ArrowDown className="sm:hidden h-5 w-5 text-slate-400 mx-auto shrink-0" />
              {/* יתרה סופית */}
              <div className={`flex-1 rounded-lg p-3 ${dashboardData.budgetFlow.netRemaining >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <div className={`text-xs font-medium ${dashboardData.budgetFlow.netRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  יתרה סופית
                </div>
                <div className={`text-lg font-bold ${dashboardData.budgetFlow.netRemaining >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatCurrency(dashboardData.budgetFlow.netRemaining)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* התראות תקציב (אם יש) */}
      {dashboardData.alerts.length > 0 && <BudgetAlerts alerts={dashboardData.alerts} />}

      {/* גרפים - שורה עם 2 עמודות */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up animate-delay-3">
        <ExpensePieChart data={dashboardData.expensesByCategory} />
        <WeeklyBarChart
          data={dashboardData.weeklyExpenses}
          averageWeeklyBudget={averageWeeklyBudget}
        />
      </div>

      {/* עסקאות אחרונות */}
      <div className="animate-fade-in-up animate-delay-4">
      <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}

// Main page component
export default function DashboardPage() {
  const { selectedMonth, selectedYear } = useAppStore();

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

      {/* Main content */}
      <DashboardContent month={selectedMonth} year={selectedYear} />
    </div>
  );
}

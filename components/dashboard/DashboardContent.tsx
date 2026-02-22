'use client';

import { getDashboardData } from '@/app/actions/dashboard';
import { BudgetSummaryHero } from '@/components/dashboard/BudgetSummaryHero';
import { AffordabilityChecker } from '@/components/dashboard/AffordabilityChecker';
import { RemainingBudget } from '@/components/dashboard/RemainingBudget';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { DbConnectionError } from '@/components/DbConnectionError';
import Link from 'next/link';
import { Plus, Wallet } from 'lucide-react';

function EmptyMonthState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
          <Wallet className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">אין נתונים בחודש זה</h2>
          <p className="text-muted-foreground text-sm">הוסף עסקאות או הגדר תקציב כדי להתחיל</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף עסקה
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-500 text-primary-500 px-5 py-2.5 text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            הגדר תקציב
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center">
          <Wallet className="w-10 h-10 text-primary-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            ברוך הבא לכלכלת הבית!
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            3 צעדים פשוטים להתחלה:
          </p>
          <div className="text-right space-y-2 max-w-xs mx-auto">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span className="text-muted-foreground">הגדר תקציב חודשי לכל קטגוריה</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span className="text-muted-foreground">הזן הוצאות והכנסות בלחיצה על +</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span className="text-muted-foreground">עקוב אחרי כמה נשאר להוציא</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
          >
            הגדר תקציב
          </Link>
          <Link
            href="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-500 text-primary-500 px-5 py-2.5 text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף עסקה
          </Link>
        </div>
      </div>
    </div>
  );
}

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

interface DashboardContentProps {
  data: DashboardData | null;
  error: boolean;
  month: number;
  year: number;
}

export function DashboardContent({ data, error }: DashboardContentProps) {
  if (error) return <DbConnectionError />;
  if (!data) return <EmptyState />;

  const transactions = data.transactionsResult.transactions || [];
  const recurringGenerated = data.transactionsResult.recurringGenerated;

  const hasBudgetSetup =
    data.budgetSummary.totalBudget > 0 ||
    data.budgetByCategory.some((c) => c.plannedAmount > 0);

  const hasData =
    transactions.length > 0 ||
    data.summary.totalIncome > 0 ||
    data.summary.totalExpenses > 0;

  if (!hasData && !hasBudgetSetup) return <EmptyState />;
  if (!hasData && hasBudgetSetup) return <EmptyMonthState />;

  const totalBudget = data.budgetSummary.totalBudget;
  const totalSpent = data.budgetSummary.totalSpent;
  const remaining = totalBudget - totalSpent;
  const utilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Recurring transactions banner */}
      {recurringGenerated && recurringGenerated.count > 0 && (
        <div className="rounded-lg border border-border bg-primary-50 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 shrink-0">
                <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-sm text-primary-600 truncate">
                <span className="font-medium">{recurringGenerated.count} עסקאות חוזרות</span>
                {' '}נוצרו
              </p>
            </div>
            <Link href="/transactions" className="rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-600 transition-colors shrink-0">
              צפה
            </Link>
          </div>
        </div>
      )}

      {/* HERO: Budget summary */}
      <BudgetSummaryHero
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        remaining={remaining}
        utilizationPercent={utilizationPercent}
      />

      {/* "Can I afford?" checker */}
      <AffordabilityChecker
        categories={data.budgetByCategory}
        totalRemaining={remaining}
      />

      {/* Category grid */}
      <RemainingBudget
        categories={data.budgetByCategory}
        totalRemaining={remaining}
        totalBudget={totalBudget}
        totalSpent={totalSpent}
      />

      {/* Budget alerts */}
      {data.alerts.length > 0 && <BudgetAlerts alerts={data.alerts} />}

      {/* Recent transactions */}
      <RecentTransactions transactions={transactions} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { copyBudgetFromPreviousMonth, getBudgetPageData } from '@/app/actions/budgets';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  plannedAmount: number;
  actualSpent: number;
  remaining: number;
  usagePercent: number;
  alertLevel: 'success' | 'warning' | 'danger' | 'error';
  children: Array<{
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    plannedAmount: number;
    actualSpent: number;
    remaining: number;
    usagePercent: number;
  }>;
}

interface BudgetSummary {
  totalPlanned: number;
  totalActual: number;
  totalRemaining: number;
  totalUsagePercent: number;
}

interface BudgetContentProps {
  initialBudgetData: unknown[];
  initialSummary: BudgetSummary | null;
  month: number;
  year: number;
}

export function BudgetContent({ initialBudgetData, initialSummary, month, year }: BudgetContentProps) {
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>(initialBudgetData as BudgetCategory[]);
  const [summary, setSummary] = useState<BudgetSummary | null>(initialSummary);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  const reloadData = async () => {
    try {
      const { budget, summaryData } = await getBudgetPageData(month, year);
      setBudgetData(budget as BudgetCategory[]);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error reloading budget:', error);
    }
  };

  const handleCopyFromPreviousMonth = async () => {
    try {
      setCopying(true);
      const result = await copyBudgetFromPreviousMonth(month, year);
      if (result.success) {
        toast({ title: 'הצלחה!', description: result.message });
        await reloadData();
      } else {
        toast({ title: 'שים לב', description: result.message, variant: 'default' });
      }
    } catch (error) {
      console.error('Error copying budget:', error);
      toast({ title: 'שגיאה', description: 'לא הצלחנו להעתיק את התקציב מהחודש הקודם', variant: 'destructive' });
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
          תקציב חודשי
        </h1>
        <Button variant="outline" size="sm" onClick={handleCopyFromPreviousMonth} disabled={copying} className="gap-1 sm:gap-2 text-xs sm:text-sm">
          {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">העתק מחודש קודם</span>
          <span className="sm:hidden">העתק</span>
        </Button>
      </div>

      {/* Summary card */}
      {summary && (
        <Card className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-muted-foreground">סה&quot;כ מתוכנן</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{formatCurrency(summary.totalPlanned)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-muted-foreground">סה&quot;כ בפועל</p>
              <p className="text-lg sm:text-xl font-bold text-primary-500">{formatCurrency(summary.totalActual)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-muted-foreground">סה&quot;כ נותר</p>
              <p className={`text-lg sm:text-xl font-bold ${summary.totalRemaining >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
                {formatCurrency(summary.totalRemaining)}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-muted-foreground">ניצול</p>
              <p className={`text-lg sm:text-xl font-bold ${
                summary.totalUsagePercent >= 100 ? 'text-expense-500' :
                summary.totalUsagePercent >= 90 ? 'text-orange-600' :
                summary.totalUsagePercent >= 70 ? 'text-warning-500' :
                'text-income-500'
              }`}>
                {summary.totalUsagePercent.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Budget table */}
      {budgetData.length === 0 ? (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">לא הוגדר תקציב</h2>
            <p className="text-muted-foreground text-center text-sm max-w-md mb-4">
              התחל בהגדרת תקציב חודשי כדי לעקוב אחר ההוצאות שלך
            </p>
            <Button onClick={handleCopyFromPreviousMonth} disabled={copying} className="gap-2">
              {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              העתק מחודש קודם
            </Button>
          </div>
        </Card>
      ) : (
        <BudgetTable data={budgetData} month={month} year={year} onUpdate={reloadData} />
      )}
    </div>
  );
}

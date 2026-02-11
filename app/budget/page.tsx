'use client';

import { useEffect, useState } from 'react';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { getBudgetForMonth, copyBudgetFromPreviousMonth, getBudgetSummary } from '@/app/actions/budgets';
import { BudgetTable } from '@/components/budget/BudgetTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Copy, Loader2 } from 'lucide-react';
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

export default function BudgetPage() {
  const { selectedMonth, selectedYear, monthYearDisplay, goToNextMonth, goToPrevMonth } = useMonthNavigation();
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  // טעינת נתוני תקציב
  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [budget, summaryData] = await Promise.all([
        getBudgetForMonth(selectedMonth, selectedYear),
        getBudgetSummary(selectedMonth, selectedYear),
      ]);
      setBudgetData(budget as BudgetCategory[]);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading budget:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את נתוני התקציב',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // טעינה מחדש כשמשנים חודש
  useEffect(() => {
    loadBudgetData();
  }, [selectedMonth, selectedYear]);

  // העתקה מחודש קודם
  const handleCopyFromPreviousMonth = async () => {
    try {
      setCopying(true);
      const result = await copyBudgetFromPreviousMonth(selectedMonth, selectedYear);
      
      if (result.success) {
        toast({
          title: 'הצלחה!',
          description: result.message,
        });
        // טעינה מחדש של הנתונים
        await loadBudgetData();
      } else {
        toast({
          title: 'שים לב',
          description: result.message,
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error copying budget:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו להעתיק את התקציב מהחודש הקודם',
        variant: 'destructive',
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header עם בחירת חודש */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            תקציב חודשי
          </h1>
        </div>

        {/* בורר חודש */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevMonth}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center">
              <span className="text-lg font-semibold text-slate-800">
                {monthYearDisplay}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromPreviousMonth}
            disabled={copying}
            className="gap-2"
          >
            {copying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            העתק מחודש קודם
          </Button>
        </div>
      </div>

      {/* כרטיס סיכום */}
      {summary && (
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">סה"כ מתוכנן</p>
              <p className="text-xl font-bold text-slate-800">
                {formatCurrency(summary.totalPlanned)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">סה"כ בפועל</p>
              <p className="text-xl font-bold text-cyan-600">
                {formatCurrency(summary.totalActual)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">סה"כ נותר</p>
              <p className={`text-xl font-bold ${summary.totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalRemaining)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">ניצול</p>
              <p className={`text-xl font-bold ${
                summary.totalUsagePercent >= 100 ? 'text-red-600' :
                summary.totalUsagePercent >= 90 ? 'text-orange-600' :
                summary.totalUsagePercent >= 70 ? 'text-yellow-600' :
                'text-emerald-600'
              }`}>
                {summary.totalUsagePercent.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* טבלת תקציב */}
      {loading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </Card>
      ) : budgetData.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-600">
              עדיין לא הגדרת תקציב לחודש זה
            </p>
            <Button
              variant="outline"
              onClick={handleCopyFromPreviousMonth}
              disabled={copying}
              className="gap-2"
            >
              {copying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              העתק מחודש קודם
            </Button>
          </div>
        </Card>
      ) : (
        <BudgetTable
          data={budgetData}
          month={selectedMonth}
          year={selectedYear}
          onUpdate={loadBudgetData}
        />
      )}
    </div>
  );
}

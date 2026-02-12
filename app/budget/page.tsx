'use client';

import { useEffect, useState } from 'react';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { getBudgetForMonth, copyBudgetFromPreviousMonth, getBudgetSummary } from '@/app/actions/budgets';
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

export default function BudgetPage() {
  const { selectedMonth, selectedYear } = useMonthNavigation();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          תקציב חודשי
        </h1>
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

      {/* כרטיס סיכום */}
      {summary && (
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">סה&quot;כ מתוכנן</p>
              <p className="text-xl font-bold text-slate-800">
                {formatCurrency(summary.totalPlanned)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">סה&quot;כ בפועל</p>
              <p className="text-xl font-bold text-cyan-600">
                {formatCurrency(summary.totalActual)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">סה&quot;כ נותר</p>
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
        <Card className="p-6 animate-pulse">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </Card>
      ) : budgetData.length === 0 ? (
        <Card className="p-6 animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              לא הוגדר תקציב
            </h2>
            <p className="text-slate-600 text-center max-w-md mb-6">
              התחל בהגדרת תקציב חודשי כדי לעקוב אחר ההוצאות שלך
            </p>
            <Button
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
        <div className="animate-in fade-in duration-300">
          <BudgetTable
            data={budgetData}
            month={selectedMonth}
            year={selectedYear}
            onUpdate={loadBudgetData}
          />
        </div>
      )}
    </div>
  );
}

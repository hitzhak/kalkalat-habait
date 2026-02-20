'use client';

import { useState, useEffect } from 'react';
import { getSavingsGoals } from '@/app/actions/savings';
import { getLoans, getLoansSummary } from '@/app/actions/loans';
import { SavingsGoalCard } from '@/components/savings/SavingsGoalCard';
import { CreateGoalDialog } from '@/components/savings/CreateGoalDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Landmark, Loader2 } from 'lucide-react';

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return `\u2066${sign}₪${formatted}\u2069`;
}

export default function SavingsPage() {
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loansSummary, setLoansSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goals, loansResult, loanSum] = await Promise.all([
        getSavingsGoals(),
        getLoans(),
        getLoansSummary(),
      ]);
      setSavingsGoals(Array.isArray(goals) ? goals : []);
      if (loansResult?.success && 'data' in loansResult) {
        setLoans(loansResult.data || []);
      }
      if (loanSum?.success && 'data' in loanSum) {
        setLoansSummary(loanSum.data);
      }
    } catch {
      setSavingsGoals([]);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">חיסכון והלוואות</h1>
        <p className="text-muted-foreground mt-1">
          מטרות חיסכון והלוואות פעילות
        </p>
      </div>

      {/* מטרות חיסכון */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <CardTitle>מטרות חיסכון</CardTitle>
            </div>
            <CreateGoalDialog onSuccess={loadData} />
          </div>
        </CardHeader>
        <CardContent>
          {savingsGoals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>אין מטרות חיסכון עדיין</p>
              <CreateGoalDialog onSuccess={loadData} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {savingsGoals.map((goal) => (
                <SavingsGoalCard key={goal.id} goal={goal} onRefresh={loadData} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* הלוואות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-amber-600" />
            הלוואות וחובות
          </CardTitle>
          {loansSummary && (
            <CardDescription>
              סה&quot;כ חוב: {formatCurrency(Number(loansSummary.totalDebt || 0))} · תשלום חודשי:{' '}
              {formatCurrency(Number(loansSummary.totalMonthlyPayment || 0))}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>אין הלוואות פעילות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan: any) => {
                const paidPct =
                  Number(loan.originalAmount) > 0
                    ? ((Number(loan.originalAmount) - Number(loan.remainingAmount)) /
                        Number(loan.originalAmount)) *
                      100
                    : 0;
                return (
                  <div
                    key={loan.id}
                    className="p-4 rounded-lg bg-secondary space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{loan.name}</span>
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(Number(loan.remainingAmount))}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(paidPct, 100)}
                      className="h-2"
                      indicatorClassName="bg-amber-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>שולם {Math.round(paidPct)}%</span>
                      <span>
                        תשלום: {formatCurrency(Number(loan.monthlyPayment))}/חודש
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

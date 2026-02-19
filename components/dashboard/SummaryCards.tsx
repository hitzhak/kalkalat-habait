import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  previousMonthIncome?: number;
  previousMonthExpenses?: number;
  previousMonthBalance?: number;
}

export function SummaryCards({
  totalIncome,
  totalExpenses,
  balance,
  previousMonthIncome = 0,
  previousMonthExpenses = 0,
  previousMonthBalance = 0,
}: SummaryCardsProps) {
  const incomeChange =
    previousMonthIncome > 0
      ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100
      : 0;

  const expensesChange =
    previousMonthExpenses > 0
      ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
      : 0;

  return (
    <>
      {/* Mobile: compact 3-column strip */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">הכנסות</p>
            <p className="text-base font-bold text-income-500 mt-0.5">
              {formatCurrency(totalIncome)}
            </p>
            {previousMonthIncome > 0 && (
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {incomeChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-income-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-expense-500" />
                )}
                <span className={`text-[10px] ${incomeChange >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
                  {formatPercent(Math.abs(incomeChange))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">הוצאות</p>
            <p className="text-base font-bold text-expense-500 mt-0.5">
              {formatCurrency(totalExpenses)}
            </p>
            {previousMonthExpenses > 0 && (
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {expensesChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-expense-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-income-500" />
                )}
                <span className={`text-[10px] ${expensesChange >= 0 ? 'text-expense-500' : 'text-income-500'}`}>
                  {formatPercent(Math.abs(expensesChange))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">מאזן</p>
            <p className={`text-base font-bold mt-0.5 ${balance >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
              {formatCurrency(balance)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {balance >= 0 ? 'עודף' : 'גירעון'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: full cards with icons */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">הכנסות</p>
                <p className="text-2xl font-bold text-income-500">
                  {formatCurrency(totalIncome)}
                </p>
                {previousMonthIncome > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {incomeChange >= 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-income-500" />
                        <span className="text-sm text-income-500">{formatPercent(Math.abs(incomeChange))}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-expense-500" />
                        <span className="text-sm text-expense-500">{formatPercent(Math.abs(incomeChange))}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-income-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">הוצאות</p>
                <p className="text-2xl font-bold text-expense-500">
                  {formatCurrency(totalExpenses)}
                </p>
                {previousMonthExpenses > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {expensesChange >= 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-expense-500" />
                        <span className="text-sm text-expense-500">{formatPercent(Math.abs(expensesChange))}</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-income-500" />
                        <span className="text-sm text-income-500">{formatPercent(Math.abs(expensesChange))}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="w-6 h-6 text-expense-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">מאזן</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
                  {formatCurrency(balance)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{balance >= 0 ? 'עודף' : 'גירעון'}</p>
              </div>
              <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <Scale className={`w-6 h-6 ${balance >= 0 ? 'text-income-500' : 'text-expense-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

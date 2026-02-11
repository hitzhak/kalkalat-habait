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
  // חישוב אחוזי שינוי
  const incomeChange =
    previousMonthIncome > 0
      ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100
      : 0;

  const expensesChange =
    previousMonthExpenses > 0
      ? ((totalExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
      : 0;

  const balanceChange =
    previousMonthBalance !== 0
      ? ((balance - previousMonthBalance) / Math.abs(previousMonthBalance)) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* כרטיס הכנסות */}
      <Card className="bg-white rounded-xl shadow-sm animate-in fade-in duration-300 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">הכנסות</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(totalIncome)}
              </p>
              {previousMonthIncome > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {incomeChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-500">
                        {formatPercent(Math.abs(incomeChange))}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">
                        {formatPercent(Math.abs(incomeChange))}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* כרטיס הוצאות */}
      <Card className="bg-white rounded-xl shadow-sm animate-in fade-in duration-300 delay-75 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">הוצאות</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalExpenses)}
              </p>
              {previousMonthExpenses > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {expensesChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">
                        {formatPercent(Math.abs(expensesChange))}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-500">
                        {formatPercent(Math.abs(expensesChange))}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* כרטיס מאזן */}
      <Card className="bg-white rounded-xl shadow-sm animate-in fade-in duration-300 delay-150 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">מאזן</p>
              <p
                className={`text-2xl font-bold ${
                  balance >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {formatCurrency(balance)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {balance >= 0 ? 'עודף' : 'גירעון'}
              </p>
              {previousMonthBalance !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {balanceChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-500">
                        {formatPercent(Math.abs(balanceChange))}
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">
                        {formatPercent(Math.abs(balanceChange))}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-lg ${
                balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'
              }`}
            >
              <Scale
                className={`w-6 h-6 ${
                  balance >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

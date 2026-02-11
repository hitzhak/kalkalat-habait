import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // מגביל ל-5 עסקאות אחרונות
  const recentTransactions = transactions.slice(0, 5);

  if (recentTransactions.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">עסקאות אחרונות</CardTitle>
          <Link
            href="/transactions"
            className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
          >
            צפה בכל העסקאות
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            אין עסקאות להצגה
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">עסקאות אחרונות</CardTitle>
        <Link
          href="/transactions"
          className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition-colors"
        >
          צפה בכל העסקאות
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => {
            // קבלת האייקון הדינמי
            const IconComponent = transaction.category.icon
              ? (LucideIcons[
                  transaction.category.icon as keyof typeof LucideIcons
                ] as React.ComponentType<{ className?: string }>)
              : LucideIcons.Circle;

            // פורמט תאריך יחסי
            const relativeDate = formatDistanceToNow(new Date(transaction.date), {
              addSuffix: true,
              locale: he,
            });

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {/* אייקון קטגוריה */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: transaction.category.color
                      ? `${transaction.category.color}20`
                      : '#f1f5f9',
                  }}
                >
                  {IconComponent && (
                    <IconComponent
                      className="w-5 h-5"
                      style={{
                        color: transaction.category.color || '#64748b',
                      }}
                    />
                  )}
                </div>

                {/* פרטי עסקה */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {transaction.category.name}
                  </p>
                  <p className="text-xs text-slate-500">{relativeDate}</p>
                </div>

                {/* סכום */}
                <div className="text-left">
                  <p
                    className={`font-bold ${
                      transaction.type === 'INCOME'
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

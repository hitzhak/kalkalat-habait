'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getBudgetTailwindBg } from '@/lib/colors';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { getTransactionsByCategory } from '@/app/actions/transactions';
import { Plus, Loader2 } from 'lucide-react';
import type { BudgetCategoryData } from '@/components/dashboard/CategoryCard';

interface CategoryDetailProps {
  category: BudgetCategoryData | null;
  open: boolean;
  onClose: () => void;
}

interface TransactionItem {
  id: string;
  amount: number;
  date: string;
  notes?: string | null;
  type: string;
  isFixed: boolean;
  category?: { name: string; icon: string | null } | null;
}

export function CategoryDetail({ category, open, onClose }: CategoryDetailProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { selectedMonth, selectedYear } = useMonthNavigation();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && category) {
      setLoading(true);
      getTransactionsByCategory(category.id, selectedMonth, selectedYear)
        .then((data) => setTransactions(data as TransactionItem[]))
        .catch(() => setTransactions([]))
        .finally(() => setLoading(false));
    } else {
      setTransactions([]);
    }
  }, [open, category?.id, selectedMonth, selectedYear]);

  if (!category) return null;

  const barColorClass = getBudgetTailwindBg(category.usagePercent);

  const content = (
    <div className="space-y-4">
      {/* Budget summary */}
      <div className="space-y-3">
        <div className="text-center">
          <div className={`text-3xl font-bold ${category.remaining < 0 ? 'text-expense-500' : 'text-income-500'}`}>
            {formatCurrency(category.remaining)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            נשאר מתוך {formatCurrency(category.plannedAmount)}
          </div>
        </div>

        <Progress
          value={Math.min(category.usagePercent, 100)}
          className="h-3"
          indicatorClassName={barColorClass}
        />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>הוצאות: {formatCurrency(category.actualSpent)}</span>
          <span>{Math.round(category.usagePercent)}% ניצול</span>
        </div>
      </div>

      {/* Transactions list */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">עסקאות החודש</h4>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין עסקאות בקטגוריה זו החודש</p>
        ) : (
          <div className="space-y-1 max-h-[40vh] overflow-y-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-secondary">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {tx.notes || (tx.isFixed ? 'הוצאה קבועה' : 'הוצאה')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(new Date(tx.date))}
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 mr-3 ${tx.type === 'INCOME' ? 'text-income-500' : 'text-expense-500'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const title = (
    <span className="flex items-center gap-2">
      {category.name}
    </span>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}

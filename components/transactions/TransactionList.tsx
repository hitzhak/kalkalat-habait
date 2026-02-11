'use client';

import { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isSameMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import * as Icons from 'lucide-react';
import { TransactionType } from '@/types';
import { deleteTransaction } from '@/app/actions/transactions';
import { cn } from '@/lib/utils';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string | Date;
  isFixed: boolean;
  notes?: string | null;
  category: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: () => void;
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // קיבוץ עסקאות לפי תאריך
  const groupedTransactions = useMemo(() => {
    const groups: {
      today: Transaction[];
      yesterday: Transaction[];
      fixed: Transaction[];
      other: Record<string, Transaction[]>;
    } = {
      today: [],
      yesterday: [],
      fixed: [],
      other: {},
    };

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);

      if (tx.isFixed) {
        groups.fixed.push(tx);
      } else if (isToday(txDate)) {
        groups.today.push(tx);
      } else if (isYesterday(txDate)) {
        groups.yesterday.push(tx);
      } else {
        const dateKey = format(txDate, 'yyyy-MM-dd');
        if (!groups.other[dateKey]) {
          groups.other[dateKey] = [];
        }
        groups.other[dateKey].push(tx);
      }
    });

    return groups;
  }, [transactions]);

  // פורמט תאריך לכותרת קבוצה
  const formatGroupDate = (date: Date) => {
    return format(date, 'd בMMMM', { locale: he });
  };

  // מחיקת עסקה
  const handleDelete = async () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(transactionToDelete);
      toast({
        title: 'העסקה נמחקה',
        description: 'העסקה נמחקה בהצלחה',
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      onDelete?.();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה במחיקת העסקה',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // רשימה ריקה
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-800">אין עסקאות להצגה</p>
        <p className="mt-2 text-sm text-slate-500">לחץ על כפתור + למטה כדי להוסיף עסקה</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* היום */}
        {groupedTransactions.today.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-600">היום</h3>
            <div className="space-y-2">
              {groupedTransactions.today.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDeleteClick={(id) => {
                    setTransactionToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* אתמול */}
        {groupedTransactions.yesterday.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-600">אתמול</h3>
            <div className="space-y-2">
              {groupedTransactions.yesterday.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDeleteClick={(id) => {
                    setTransactionToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* תאריכים אחרים */}
        {Object.entries(groupedTransactions.other)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([dateKey, txs]) => {
            const date = new Date(dateKey);
            return (
              <div key={dateKey}>
                <h3 className="mb-3 text-sm font-medium text-slate-600">
                  {formatGroupDate(date)}
                </h3>
                <div className="space-y-2">
                  {txs.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onEdit={onEdit}
                      onDeleteClick={(id) => {
                        setTransactionToDelete(id);
                        setDeleteDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}

        {/* הוצאות קבועות */}
        {groupedTransactions.fixed.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-600">
              הוצאות קבועות - {format(new Date(), 'MMMM', { locale: he })}
            </h3>
            <div className="space-y-2">
              {groupedTransactions.fixed.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDeleteClick={(id) => {
                    setTransactionToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* דיאלוג אישור מחיקה */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את העסקה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו לא ניתנת לביטול. העסקה תימחק לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'מוחק...' : 'מחק'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// קומפוננט עסקה בודדת
function TransactionItem({
  transaction,
  onEdit,
  onDeleteClick,
}: {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDeleteClick: (id: string) => void;
}) {
  const isIncome = transaction.type === TransactionType.INCOME;
  const IconComponent = transaction.category.icon
    ? (Icons as any)[transaction.category.icon]
    : null;

  return (
    <Card className="p-3 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        {/* אייקון קטגוריה */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: transaction.category.color
              ? `${transaction.category.color}20`
              : '#e2e8f0',
          }}
        >
          {IconComponent ? (
            <IconComponent
              size={24}
              style={{ color: transaction.category.color || '#64748b' }}
            />
          ) : (
            <Icons.Receipt size={24} className="text-slate-500" />
          )}
        </div>

        {/* פרטי עסקה */}
        <div className="flex-1 cursor-pointer" onClick={() => onEdit?.(transaction)}>
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-900">{transaction.category.name}</p>
            <p
              className={cn(
                'text-lg font-semibold',
                isIncome ? 'text-green-600' : 'text-red-600'
              )}
            >
              {isIncome ? '+' : '-'}
              {transaction.amount.toLocaleString('he-IL')}₪
            </p>
          </div>
          {transaction.notes && (
            <p className="mt-1 text-sm text-slate-500">{transaction.notes}</p>
          )}
        </div>

        {/* כפתור מחיקה */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(transaction.id);
          }}
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </Card>
  );
}

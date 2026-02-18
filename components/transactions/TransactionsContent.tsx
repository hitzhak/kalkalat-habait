'use client';

import { useState } from 'react';
import { TransactionType } from '@/types';
import { getTransactionsPageData } from '@/app/actions/transactions';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabValue = 'all' | 'variable' | 'fixed' | 'income';

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

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  fixedExpenses: number;
  variableExpenses: number;
}

interface TransactionsContentProps {
  initialTransactions: unknown[];
  initialSummary: TransactionSummary | null;
  month: number;
  year: number;
}

export function TransactionsContent({ initialTransactions, initialSummary, month, year }: TransactionsContentProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions as Transaction[]);
  const [summary, setSummary] = useState<TransactionSummary | null>(initialSummary);
  const [activeTab, setActiveTab] = useState<TabValue>('variable');
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const reloadData = async () => {
    try {
      const { transactionsResult, summary: sum } = await getTransactionsPageData(month, year);
      setTransactions((transactionsResult.transactions || []) as Transaction[]);
      setSummary(sum);
    } catch (error) {
      console.error('Error reloading transactions:', error);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    switch (activeTab) {
      case 'variable': return tx.type === TransactionType.EXPENSE && !tx.isFixed;
      case 'fixed': return tx.isFixed;
      case 'income': return tx.type === TransactionType.INCOME;
      default: return true;
    }
  });

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditTransaction(null);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Summary cards */}
      <div className="grid gap-2 sm:gap-4 grid-cols-3">
        <Card className="p-2.5 sm:p-4">
          <p className="text-[11px] sm:text-sm text-slate-600">הכנסות</p>
          <p className="mt-1 text-base sm:text-2xl font-bold text-green-600">
            ₪{summary?.totalIncome?.toLocaleString('he-IL')}
          </p>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <p className="text-[11px] sm:text-sm text-slate-600">הוצאות</p>
          <p className="mt-1 text-base sm:text-2xl font-bold text-red-600">
            ₪{summary?.totalExpenses?.toLocaleString('he-IL')}
          </p>
        </Card>
        <Card className="p-2.5 sm:p-4">
          <p className="text-[11px] sm:text-sm text-slate-600">מאזן</p>
          <p className={`mt-1 text-base sm:text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(summary?.balance ?? 0) >= 0 ? '+' : ''}₪{(summary?.balance ?? 0).toLocaleString('he-IL')}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">הכל</TabsTrigger>
          <TabsTrigger value="variable" className="text-xs sm:text-sm">משתנות</TabsTrigger>
          <TabsTrigger value="fixed" className="text-xs sm:text-sm">קבועות</TabsTrigger>
          <TabsTrigger value="income" className="text-xs sm:text-sm">הכנסות</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 min-h-[400px]">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">אין עסקאות</h2>
              <p className="text-slate-500 text-sm text-center max-w-md">
                לחץ על + כדי להוסיף עסקה חדשה
              </p>
            </div>
          ) : (
            <TransactionList
              transactions={filteredTransactions}
              onEdit={handleEdit}
              onDelete={reloadData}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Edit form */}
      <TransactionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        transaction={editTransaction}
        onSuccess={reloadData}
      />
    </div>
  );
}

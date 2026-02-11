'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { TransactionType } from '@/types';
import { getTransactions, getTransactionsSummary } from '@/app/actions/transactions';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

type TabValue = 'all' | 'income' | 'expense' | 'fixed';

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { selectedMonth, selectedYear } = useAppStore();

  // טעינת עסקאות וסיכום
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txsResult, sum] = await Promise.all([
        getTransactions(selectedMonth, selectedYear),
        getTransactionsSummary(selectedMonth, selectedYear),
      ]);
      // חילוץ רשימת העסקאות מהתוצאה
      setTransactions((txsResult.transactions || []) as Transaction[]);
      setSummary(sum);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // סינון עסקאות לפי Tab
  const filteredTransactions = transactions.filter((tx) => {
    switch (activeTab) {
      case 'income':
        return tx.type === TransactionType.INCOME;
      case 'expense':
        return tx.type === TransactionType.EXPENSE;
      case 'fixed':
        return tx.isFixed;
      default:
        return true;
    }
  });

  // פתיחת עריכה
  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setFormOpen(true);
  };

  // סגירת טופס
  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditTransaction(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24 md:pb-6">
      {/* סיכום עליון */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-sm text-slate-600">הכנסות</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {summary?.totalIncome?.toLocaleString('he-IL')}₪
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600">הוצאות</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary?.totalExpenses?.toLocaleString('he-IL')}₪
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600">מאזן</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                (summary?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(summary?.balance ?? 0) >= 0 ? '+' : ''}
              {(summary?.balance ?? 0).toLocaleString('he-IL')}₪
            </p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">הכל</TabsTrigger>
          <TabsTrigger value="income">הכנסות</TabsTrigger>
          <TabsTrigger value="expense">הוצאות</TabsTrigger>
          <TabsTrigger value="fixed">קבועות</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-300">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                אין עסקאות החודש
              </h2>
              <p className="text-slate-600 text-center max-w-md mb-6">
                התחל בהוספת העסקה הראשונה שלך כדי לעקוב אחר ההכנסות וההוצאות
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <TransactionList
                transactions={filteredTransactions}
                onEdit={handleEdit}
                onDelete={loadData}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* טופס עריכה */}
      <TransactionForm
        open={formOpen}
        onOpenChange={handleFormClose}
        transaction={editTransaction}
        onSuccess={loadData}
      />
    </div>
  );
}

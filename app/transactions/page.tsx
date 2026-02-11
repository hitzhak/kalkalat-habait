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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [editTransaction, setEditTransaction] = useState<any>(null);
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
      setTransactions(txsResult.transactions || []);
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
  const handleEdit = (transaction: any) => {
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
                summary?.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary?.balance >= 0 ? '+' : ''}
              {summary?.balance?.toLocaleString('he-IL')}₪
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
            <div className="space-y-2">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <TransactionList
              transactions={filteredTransactions}
              onEdit={handleEdit}
              onDelete={loadData}
            />
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

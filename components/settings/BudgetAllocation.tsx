'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getBudgetForMonth, upsertBudgetItem, copyBudgetFromPreviousMonth } from '@/app/actions/budgets';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { formatCurrency } from '@/lib/formatters';
import { getBudgetTailwindBg } from '@/lib/colors';
import { Check, Copy, Loader2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  plannedAmount: number;
  actualSpent: number;
  remaining: number;
  usagePercent: number;
  alertLevel: string;
}

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return null;
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  if (!IconComponent) return null;
  return <IconComponent className="h-4 w-4" />;
}

export function BudgetAllocation() {
  const { selectedMonth, selectedYear, monthYearDisplay } = useMonthNavigation();
  const [budgetData, setBudgetData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const data = await getBudgetForMonth(selectedMonth, selectedYear);
      setBudgetData(data as BudgetCategory[]);
    } catch {
      toast.error('שגיאה בטעינת נתוני תקציב');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, [selectedMonth, selectedYear]);

  const totalAllocated = budgetData.reduce((sum, c) => sum + c.plannedAmount, 0);

  const handleSave = async (categoryId: string) => {
    const amount = parseFloat(editValue);
    if (isNaN(amount) || amount < 0) {
      toast.error('נא להזין סכום תקין');
      return;
    }
    try {
      setSaving(true);
      await upsertBudgetItem(categoryId, selectedMonth, selectedYear, amount);
      toast.success('התקציב עודכן');
      setEditingId(null);
      setEditValue('');
      await loadBudget();
    } catch {
      toast.error('שגיאה בשמירת התקציב');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    try {
      setCopying(true);
      await copyBudgetFromPreviousMonth(selectedMonth, selectedYear);
      toast.success('התקציב הועתק מהחודש הקודם');
      await loadBudget();
    } catch {
      toast.error('שגיאה בהעתקת תקציב');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>💰 תקציב חודשי — {monthYearDisplay}</CardTitle>
            <CardDescription>הקצאת תקציב לכל קטגוריה</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyFromPrevious} disabled={copying}>
            {copying ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Copy className="ml-1 h-4 w-4" />}
            העתק מחודש קודם
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : budgetData.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">אין קטגוריות הוצאה. הוסף קטגוריות קודם.</p>
        ) : (
          <div className="space-y-4">
            {/* Total summary */}
            <div className="rounded-lg bg-secondary p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">סה&quot;כ מוקצה</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(totalAllocated)}</span>
            </div>

            {/* Category list */}
            <div className="space-y-2">
              {budgetData.map((cat) => {
                const isEditing = editingId === cat.id;
                const barColor = getBudgetTailwindBg(cat.usagePercent);
                const IconEl = getCategoryIcon(cat.icon);

                return (
                  <div key={cat.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary">
                    {/* Icon + Name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {IconEl && (
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                          style={{ backgroundColor: (cat.color || '#0073EA') + '20', color: cat.color || '#0073EA' }}
                        >
                          {IconEl}
                        </div>
                      )}
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                    </div>

                    {/* Progress mini */}
                    {cat.plannedAmount > 0 && (
                      <div className="w-16 shrink-0 hidden sm:block">
                        <Progress
                          value={Math.min(cat.usagePercent, 100)}
                          className="h-1.5"
                          indicatorClassName={barColor}
                        />
                      </div>
                    )}

                    {/* Budget amount or edit */}
                    <div className="shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSave(cat.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            disabled={saving}
                          />
                          <button onClick={() => handleSave(cat.id)} disabled={saving} className="p-1">
                            <Check className="h-4 w-4 text-income-500" />
                          </button>
                          <button onClick={() => setEditingId(null)} disabled={saving} className="p-1">
                            <X className="h-4 w-4 text-expense-500" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(cat.id); setEditValue(cat.plannedAmount.toString()); }}
                          className="group flex items-center gap-1.5 text-sm font-bold tabular-nums border border-dashed border-border rounded-md px-2.5 py-1.5 text-foreground hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50/50 transition-all"
                        >
                          {formatCurrency(cat.plannedAmount)}
                          <Pencil className="h-3 w-3 text-muted-foreground group-hover:text-primary-500 transition-colors" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

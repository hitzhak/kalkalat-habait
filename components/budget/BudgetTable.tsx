'use client';

import { useState } from 'react';
import { upsertBudgetItem } from '@/app/actions/budgets';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, AlertTriangle, Check, Edit2, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import * as Icons from 'lucide-react';

interface BudgetCategoryChild {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  plannedAmount: number;
  actualSpent: number;
  remaining: number;
  usagePercent: number;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  plannedAmount: number;
  actualSpent: number;
  remaining: number;
  usagePercent: number;
  alertLevel: 'success' | 'warning' | 'danger' | 'error';
  children: BudgetCategoryChild[];
}

interface BudgetTableProps {
  data: BudgetCategory[];
  month: number;
  year: number;
  onUpdate: () => void;
}

export function BudgetTable({ data, month, year, onUpdate }: BudgetTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const startEditing = (categoryId: string, currentAmount: number) => {
    setEditingCategory(categoryId);
    setEditingValue(currentAmount.toString());
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingValue('');
  };

  const saveBudget = async (categoryId: string) => {
    try {
      setSaving(true);
      const amount = parseFloat(editingValue);

      if (isNaN(amount) || amount < 0) {
        toast({
          title: 'שגיאה',
          description: 'נא להזין סכום תקין',
          variant: 'destructive',
        });
        return;
      }

      await upsertBudgetItem(categoryId, month, year, amount);

      toast({
        title: 'הצלחה!',
        description: 'התקציב עודכן בהצלחה',
      });

      setEditingCategory(null);
      setEditingValue('');
      onUpdate();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשמור את התקציב',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  const getProgressColor = (alertLevel: string) => {
    switch (alertLevel) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-orange-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getRemainingColor = (remaining: number, usagePercent: number) => {
    if (remaining < 0 || usagePercent >= 100) return 'text-red-600';
    if (usagePercent >= 90) return 'text-orange-600';
    if (usagePercent >= 70) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  const renderMobileCategoryRow = (category: BudgetCategory, isChild: boolean = false) => {
    const isExpanded = expandedCategories.has(category.id);
    const isEditing = editingCategory === category.id;
    const hasChildren = !isChild && category.children && category.children.length > 0;

    return (
      <div key={category.id} className={isChild ? 'mr-3 border-r-2 border-slate-200 pr-3' : ''}>
        <div className="py-3 px-3">
          {/* Row 1: Icon + Name + Remaining */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {hasChildren && (
                <button
                  className="p-0.5 -mr-1 shrink-0"
                  onClick={() => toggleCategory(category.id)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              )}
              <div
                className="flex items-center gap-1.5 min-w-0"
                style={{ color: category.color || undefined }}
              >
                {getIcon(category.icon)}
                <span className="font-medium text-sm truncate">{category.name}</span>
              </div>
            </div>

            {/* Remaining amount — the hero info on mobile */}
            <div className="shrink-0 text-left">
              <span className={`font-bold text-base ${getRemainingColor(category.remaining, category.usagePercent)}`}>
                {formatCurrency(category.remaining)}
              </span>
            </div>
          </div>

          {/* Row 2: Budget info + edit + progress */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="w-16 h-6 text-xs px-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveBudget(category.id);
                      else if (e.key === 'Escape') cancelEditing();
                    }}
                    disabled={saving}
                  />
                  <button onClick={() => saveBudget(category.id)} disabled={saving} className="p-0.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </button>
                  <button onClick={cancelEditing} disabled={saving} className="p-0.5">
                    <X className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(category.id, category.plannedAmount)}
                  className="flex items-center gap-0.5 hover:text-slate-700 transition-colors"
                >
                  <span>{formatCurrency(category.plannedAmount)}</span>
                  <Edit2 className="h-2.5 w-2.5" />
                </button>
              )}
              <span className="text-slate-300">|</span>
              <span>{formatCurrency(category.actualSpent)} בפועל</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <Progress
                value={Math.min(category.usagePercent, 100)}
                className="h-1.5 flex-1"
                indicatorClassName={getProgressColor(category.alertLevel)}
              />
              <span className={`text-xs font-semibold shrink-0 ${getRemainingColor(category.remaining, category.usagePercent)}`}>
                {category.usagePercent.toFixed(0)}%
              </span>
              {category.usagePercent >= 100 && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="pb-1">
            {category.children.map((child) => renderMobileCategoryRow(child as unknown as BudgetCategory, true))}
          </div>
        )}
      </div>
    );
  };

  const renderDesktopCategoryRow = (category: BudgetCategory, isChild: boolean = false) => {
    const isExpanded = expandedCategories.has(category.id);
    const isEditing = editingCategory === category.id;
    const hasChildren = !isChild && category.children && category.children.length > 0;

    return (
      <div key={category.id}>
        <div
          className={`grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 p-4 ${
            isChild ? 'bg-slate-50 border-r-4 border-slate-200 mr-4' : 'bg-white'
          } border-b hover:bg-slate-50/50 transition-colors`}
        >
          {/* Category */}
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => toggleCategory(category.id)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <div
              className="flex items-center gap-2 min-w-0 flex-1"
              style={{ color: category.color || undefined }}
            >
              {getIcon(category.icon)}
              <span className="font-medium truncate">{category.name}</span>
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-center justify-end">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="w-20 h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveBudget(category.id);
                    else if (e.key === 'Escape') cancelEditing();
                  }}
                  disabled={saving}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveBudget(category.id)} disabled={saving}>
                  <Check className="h-4 w-4 text-emerald-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing} disabled={saving}>
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => startEditing(category.id, category.plannedAmount)}
                className="group flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
              >
                <span className="font-medium text-slate-800">{formatCurrency(category.plannedAmount)}</span>
                <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Actual */}
          <div className="flex items-center justify-end">
            <span className="font-medium text-cyan-600">{formatCurrency(category.actualSpent)}</span>
          </div>

          {/* Remaining */}
          <div className="flex items-center justify-end">
            <span className={`font-bold ${category.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(category.remaining)}
            </span>
          </div>

          {/* Percentage */}
          <div className="flex items-center justify-end gap-1">
            <span className={`font-bold text-sm ${getRemainingColor(category.remaining, category.usagePercent)}`}>
              {category.usagePercent.toFixed(0)}%
            </span>
            {category.usagePercent >= 100 && <AlertTriangle className="h-4 w-4 text-red-600" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className={`px-4 pb-2 ${isChild ? 'bg-slate-50 mr-4' : 'bg-white'}`}>
          <Progress
            value={Math.min(category.usagePercent, 100)}
            className="h-2"
            indicatorClassName={getProgressColor(category.alertLevel)}
          />
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="border-b">
            {category.children.map((child) => renderDesktopCategoryRow(child as unknown as BudgetCategory, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Mobile layout */}
      <div className="md:hidden divide-y">
        {data.map((category) => renderMobileCategoryRow(category))}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        {/* Table header */}
        <div className="bg-slate-100 border-b">
          <div className="grid grid-cols-[1fr_120px_120px_120px_100px] gap-4 p-4">
            <div className="text-sm font-semibold text-slate-700">קטגוריה</div>
            <div className="text-sm font-semibold text-slate-700 text-left">תקציב</div>
            <div className="text-sm font-semibold text-slate-700 text-left">בפועל</div>
            <div className="text-sm font-semibold text-slate-700 text-left">נותר</div>
            <div className="text-sm font-semibold text-slate-700 text-left">%</div>
          </div>
        </div>

        {/* Data rows */}
        <div className="divide-y">
          {data.map((category) => renderDesktopCategoryRow(category))}
        </div>
      </div>
    </Card>
  );
}

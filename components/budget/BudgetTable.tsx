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

  // פונקציה להרחבה/כיווץ קטגוריה
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // פונקציה להתחלת עריכה
  const startEditing = (categoryId: string, currentAmount: number) => {
    setEditingCategory(categoryId);
    setEditingValue(currentAmount.toString());
  };

  // פונקציה לביטול עריכה
  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingValue('');
  };

  // פונקציה לשמירת תקציב
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

  // פונקציה לקבלת אייקון
  const getIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  // פונקציה לקבלת צבע פס התקדמות
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

  // רינדור שורת קטגוריה
  const renderCategoryRow = (category: BudgetCategory, isChild: boolean = false) => {
    const isExpanded = expandedCategories.has(category.id);
    const isEditing = editingCategory === category.id;
    const hasChildren = !isChild && category.children && category.children.length > 0;

    return (
      <div key={category.id}>
        {/* שורה ראשית */}
        <div
          className={`grid grid-cols-[1fr_auto_auto_auto_auto] md:grid-cols-[1fr_120px_120px_120px_100px] gap-2 md:gap-4 p-4 ${
            isChild ? 'bg-slate-50 border-r-4 border-slate-200 mr-4' : 'bg-white'
          } border-b hover:bg-slate-50/50 transition-colors`}
        >
          {/* קטגוריה */}
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

          {/* תקציב */}
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
                    if (e.key === 'Enter') {
                      saveBudget(category.id);
                    } else if (e.key === 'Escape') {
                      cancelEditing();
                    }
                  }}
                  disabled={saving}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => saveBudget(category.id)}
                  disabled={saving}
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => startEditing(category.id, category.plannedAmount)}
                className="group flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
              >
                <span className="font-medium text-slate-800">
                  {formatCurrency(category.plannedAmount)}
                </span>
                <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* בפועל (מוסתר במובייל) */}
          <div className="hidden md:flex items-center justify-end">
            <span className="font-medium text-cyan-600">
              {formatCurrency(category.actualSpent)}
            </span>
          </div>

          {/* נותר (מוסתר במובייל) */}
          <div className="hidden md:flex items-center justify-end">
            <span
              className={`font-medium ${
                category.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(category.remaining)}
            </span>
          </div>

          {/* אחוז */}
          <div className="flex items-center justify-end gap-1">
            <span
              className={`font-bold text-sm ${
                category.usagePercent >= 100
                  ? 'text-red-600'
                  : category.usagePercent >= 90
                  ? 'text-orange-600'
                  : category.usagePercent >= 70
                  ? 'text-yellow-600'
                  : 'text-emerald-600'
              }`}
            >
              {category.usagePercent.toFixed(0)}%
            </span>
            {category.usagePercent >= 100 && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>

        {/* פס התקדמות */}
        <div className={`px-4 pb-2 ${isChild ? 'bg-slate-50 mr-4' : 'bg-white'}`}>
          <Progress
            value={Math.min(category.usagePercent, 100)}
            className="h-2"
            indicatorClassName={getProgressColor(category.alertLevel)}
          />
        </div>

        {/* תתי-קטגוריות */}
        {isExpanded && hasChildren && (
          <div className="border-b">
            {category.children.map((child) => renderCategoryRow(child as any, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      {/* Header של הטבלה */}
      <div className="bg-slate-100 border-b">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] md:grid-cols-[1fr_120px_120px_120px_100px] gap-2 md:gap-4 p-4">
          <div className="text-sm font-semibold text-slate-700">קטגוריה</div>
          <div className="text-sm font-semibold text-slate-700 text-left">תקציב</div>
          <div className="hidden md:block text-sm font-semibold text-slate-700 text-left">
            בפועל
          </div>
          <div className="hidden md:block text-sm font-semibold text-slate-700 text-left">
            נותר
          </div>
          <div className="text-sm font-semibold text-slate-700 text-left">%</div>
        </div>
      </div>

      {/* שורות הנתונים */}
      <div className="divide-y">
        {data.map((category) => renderCategoryRow(category))}
      </div>

      {/* הודעה למובייל */}
      <div className="md:hidden p-4 bg-slate-50 border-t">
        <p className="text-xs text-slate-600 text-center">
          💡 עברו למצב רוחב כדי לראות את כל העמודות
        </p>
      </div>
    </Card>
  );
}

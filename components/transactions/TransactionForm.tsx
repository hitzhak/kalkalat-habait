'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionType, CategoryType, Transaction } from '@/types';
import { createTransaction, updateTransaction } from '@/app/actions/transactions';
import { getParentCategories } from '@/app/actions/categories';
import { getBudgetForMonth } from '@/app/actions/budgets';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { formatCurrency } from '@/lib/formatters';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';

// סכמת ולידציה
const formSchema = z.object({
  amount: z.number().positive('הסכום חייב להיות חיובי'),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().min(1, 'חובה לבחור קטגוריה'),
  date: z.date(),
  isFixed: z.boolean().optional().default(false),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface EditableTransaction {
  id?: string;
  amount?: number;
  type?: TransactionType;
  categoryId?: string;
  date?: Date | string;
  isFixed?: boolean;
  notes?: string | null;
  isRecurring?: boolean;
  category?: { id: string; name: string; icon?: string; color?: string };
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: EditableTransaction; // עסקה קיימת לעריכה
  onSuccess?: () => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  type CategoryItem = {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
    isFixed: boolean;
    sortOrder: number;
  };
  const [allCategories, setAllCategories] = useState<{ income: CategoryItem[]; expense: CategoryItem[] }>({ income: [], expense: [] });
  const [selectedType, setSelectedType] = useState<TransactionType>(
    transaction?.type || TransactionType.EXPENSE
  );
  const [isDesktop, setIsDesktop] = useState(false);
  const [budgetData, setBudgetData] = useState<Array<{
    id: string;
    name: string;
    plannedAmount: number;
    actualSpent: number;
    remaining: number;
  }>>([]);
  const { selectedMonth, selectedYear } = useMonthNavigation();
  const { toast } = useToast();

  const categories = selectedType === TransactionType.INCOME
    ? allCategories.income
    : allCategories.expense;

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    async function loadAllCategories() {
      try {
        const [incomeCats, expenseCats] = await Promise.all([
          getParentCategories(CategoryType.INCOME),
          getParentCategories(CategoryType.EXPENSE),
        ]);
        setAllCategories({ income: incomeCats, expense: expenseCats });
      } catch (error) {
        console.error('Error loading categories:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את הקטגוריות',
          variant: 'destructive',
        });
      }
    }
    loadAllCategories();
  }, []);

  useEffect(() => {
    if (open && selectedType === TransactionType.EXPENSE) {
      getBudgetForMonth(selectedMonth, selectedYear)
        .then((data) => {
          setBudgetData(data.map((d: any) => ({
            id: d.id,
            name: d.name,
            plannedAmount: d.plannedAmount,
            actualSpent: d.actualSpent,
            remaining: d.remaining,
          })));
        })
        .catch(() => setBudgetData([]));
    }
  }, [open, selectedMonth, selectedYear, selectedType]);

  // ברירת מחדל: תאריך היום
  const defaultDate = transaction?.date
    ? new Date(transaction.date)
    : new Date(selectedYear, selectedMonth - 1, new Date().getDate());

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: transaction?.amount != null ? Number(transaction.amount) : undefined,
      type: selectedType,
      categoryId: transaction?.categoryId || '',
      date: defaultDate,
      isFixed: transaction?.isFixed || false,
      notes: transaction?.notes || '',
      tags: [],
      isRecurring: transaction?.isRecurring || false,
    },
  });

  const selectedCategoryId = watch('categoryId');
  const watchedAmount = watch('amount');
  const selectedDate = watch('date');
  const isFixed = watch('isFixed');
  const isRecurring = watch('isRecurring');

  useEffect(() => {
    setValue('type', selectedType);
    setValue('categoryId', '');
  }, [selectedType, setValue]);

  // שמירת עסקה
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const categoryName = categories.find(c => c.id === data.categoryId)?.name || '';

      if (transaction?.id) {
        await updateTransaction(transaction.id, data);
        toast({
          title: 'העסקה עודכנה',
          description: `${categoryName} — ₪${data.amount.toLocaleString('he-IL')}`,
        });
      } else {
        await createTransaction(data);
        toast({
          title: 'העסקה נוספה',
          description: `₪${data.amount.toLocaleString('he-IL')} ב${categoryName}`,
        });
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'אירעה שגיאה בשמירת העסקה';
      toast({
        title: 'שגיאה',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // קומפוננט בחירת קטגוריה
  const CategorySelector = () => {
    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

    return (
      <div className="space-y-2">
        <Label>קטגוריה *</Label>
        {selectedCategory ? (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start h-11"
            onClick={() => setValue('categoryId', '')}
          >
            <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} />
            <span className="mr-2 font-medium">{selectedCategory.name}</span>
            <span className="text-xs text-slate-400 mr-auto">שנה</span>
          </Button>
        ) : (
          <div className="max-h-[140px] overflow-y-auto rounded-lg border border-slate-100 p-1.5">
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center',
                    selectedCategoryId === category.id
                      ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                  onClick={() => setValue('categoryId', category.id)}
                >
                  <CategoryIcon icon={category.icon} color={category.color} size={20} />
                  <span className="text-[10px] sm:text-xs leading-tight truncate w-full">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {errors.categoryId && (
          <p className="text-sm text-red-500">{String(errors.categoryId.message)}</p>
        )}
      </div>
    );
  };

  const BudgetFeedback = () => {
    if (selectedType !== TransactionType.EXPENSE || !selectedCategoryId || !watchedAmount || watchedAmount <= 0) {
      return null;
    }
    const catBudget = budgetData.find(b => b.id === selectedCategoryId);
    if (!catBudget || catBudget.plannedAmount <= 0) return null;

    const afterSpend = catBudget.remaining - watchedAmount;
    const isOver = afterSpend < 0;

    return (
      <div className={`text-sm px-3 py-2 rounded-lg ${isOver ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
        {isOver
          ? `⚠️ חריגה! נשאר ${formatCurrency(catBudget.remaining)}, מבקש ${formatCurrency(watchedAmount)}`
          : `⚡ נשאר ב${catBudget.name}: ${formatCurrency(catBudget.remaining)} → ${formatCurrency(afterSpend)}`
        }
      </div>
    );
  };

  // תוכן הטופס
  const FormContent = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Toggle סוג עסקה */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={selectedType === TransactionType.EXPENSE ? 'default' : 'outline'}
          className={cn(
            'flex-1',
            selectedType === TransactionType.EXPENSE && 'bg-red-500 hover:bg-red-600'
          )}
          onClick={() => setSelectedType(TransactionType.EXPENSE)}
        >
          הוצאה
        </Button>
        <Button
          type="button"
          variant={selectedType === TransactionType.INCOME ? 'default' : 'outline'}
          className={cn(
            'flex-1',
            selectedType === TransactionType.INCOME && 'bg-green-500 hover:bg-green-600'
          )}
          onClick={() => setSelectedType(TransactionType.INCOME)}
        >
          הכנסה
        </Button>
      </div>

      {/* סכום — prominent large input */}
      <div className="space-y-2">
        <Label htmlFor="amount">סכום *</Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0"
            inputMode="decimal"
            className="text-left pr-8 h-14 text-2xl font-bold"
            {...register('amount', {
              valueAsNumber: true,
              setValueAs: (v: string) => {
                const parsed = parseFloat(v);
                return isNaN(parsed) ? undefined : parsed;
              },
            })}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 font-medium">₪</span>
        </div>
        {errors.amount && <p className="text-sm text-red-500">{String(errors.amount.message)}</p>}
      </div>

      {/* בחירת קטגוריה */}
      <CategorySelector />

      {/* Live budget feedback */}
      <BudgetFeedback />

      {/* כפתור פרטים נוספים */}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span>פרטים נוספים</span>
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* פרטים נוספים - מתרחב */}
      {showDetails && (
        <div className="space-y-4 rounded-lg border p-4">
          {/* תאריך */}
          <div className="space-y-2">
            <Label>תאריך</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-right font-normal"
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue('date', date)}
                  initialFocus
                  locale={he}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* הוצאה קבועה */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isFixed">הוצאה קבועה</Label>
            <input
              type="checkbox"
              id="isFixed"
              className="h-5 w-5 rounded border-slate-300"
              {...register('isFixed')}
            />
          </div>

          {/* חוזרת כל חודש */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isRecurring">חוזרת כל חודש</Label>
            <input
              type="checkbox"
              id="isRecurring"
              className="h-5 w-5 rounded border-slate-300"
              {...register('isRecurring')}
            />
          </div>

          {/* הערות */}
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              placeholder="הערות נוספות..."
              className="resize-none"
              rows={3}
              {...register('notes')}
            />
          </div>
        </div>
      )}

      {/* כפתורי פעולה */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          ביטול
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : transaction ? 'עדכן' : 'שמור'}
        </Button>
      </div>
    </form>
  );

  // בדסקטופ (md+) - Dialog, במובייל - Sheet
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] sm:min-h-[520px]">
          <DialogHeader>
            <DialogTitle>
              {transaction ? 'עריכת עסקה' : 'הוספת עסקה'}
            </DialogTitle>
            <DialogDescription>
              {transaction ? 'ערוך את פרטי העסקה' : 'הזן את פרטי העסקה החדשה'}
            </DialogDescription>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {transaction ? 'עריכת עסקה' : 'הוספת עסקה'}
          </SheetTitle>
          <SheetDescription>
            {transaction ? 'ערוך את פרטי העסקה' : 'הזן את פרטי העסקה החדשה'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <FormContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// קומפוננט עזר להצגת אייקון קטגוריה
function CategoryIcon({
  icon,
  color,
  size = 20,
}: {
  icon?: string;
  color?: string;
  size?: number;
}) {
  if (!icon) return null;

  const IconComponent = (Icons as any)[icon];
  if (!IconComponent) return null;

  return (
    <IconComponent
      size={size}
      className="shrink-0"
      style={{ color: color || 'currentColor' }}
    />
  );
}

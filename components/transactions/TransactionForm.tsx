'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionType } from '@/types';
import { createTransaction, updateTransaction } from '@/app/actions/transactions';
import { getParentCategories } from '@/app/actions/categories';
import { useAppStore } from '@/stores/appStore';

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
  isFixed: z.boolean().default(false),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any; // עסקה קיימת לעריכה
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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<TransactionType>(
    transaction?.type || TransactionType.EXPENSE
  );
  const [isDesktop, setIsDesktop] = useState(false);
  const { selectedMonth, selectedYear } = useAppStore();
  const { toast } = useToast();

  // זיהוי גודל מסך
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // טעינת קטגוריות
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getParentCategories(selectedType);
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את הקטגוריות',
          variant: 'destructive',
        });
      }
    }
    loadCategories();
  }, [selectedType]);

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
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: transaction?.amount || undefined,
      type: selectedType,
      categoryId: transaction?.categoryId || '',
      date: defaultDate,
      isFixed: transaction?.isFixed || false,
      notes: transaction?.notes || '',
      isRecurring: transaction?.isRecurring || false,
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedDate = watch('date');
  const isFixed = watch('isFixed');
  const isRecurring = watch('isRecurring');

  // עדכון הטופס כשמשנים את סוג העסקה
  useEffect(() => {
    setValue('type', selectedType);
  }, [selectedType, setValue]);

  // שמירת עסקה
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (transaction?.id) {
        // עדכון עסקה קיימת
        await updateTransaction(transaction.id, data);
        toast({
          title: 'העסקה עודכנה',
          description: 'העסקה עודכנה בהצלחה',
        });
      } else {
        // יצירת עסקה חדשה
        await createTransaction(data);
        toast({
          title: 'העסקה נוספה',
          description: 'העסקה נוספה בהצלחה',
        });
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.message || 'אירעה שגיאה בשמירת העסקה',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // קומפוננט בחירת קטגוריה - Grid של אייקונים
  const CategorySelector = () => {
    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

    return (
      <div className="space-y-2">
        <Label>קטגוריה *</Label>
        {selectedCategory ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setValue('categoryId', '')}
            >
              <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} />
              <span className="mr-2">{selectedCategory.name}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                className="h-20 flex-col gap-1 p-2"
                onClick={() => setValue('categoryId', category.id)}
              >
                <CategoryIcon icon={category.icon} color={category.color} size={24} />
                <span className="text-xs">{category.name}</span>
              </Button>
            ))}
          </div>
        )}
        {errors.categoryId && (
          <p className="text-sm text-red-500">{errors.categoryId.message}</p>
        )}
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

      {/* סכום */}
      <div className="space-y-2">
        <Label htmlFor="amount">סכום *</Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0"
            autoFocus
            inputMode="decimal"
            className="text-left pr-8"
            {...register('amount', { valueAsNumber: true })}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₪</span>
        </div>
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      {/* בחירת קטגוריה */}
      <CategorySelector />

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
        <DialogContent className="sm:max-w-[500px]">
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

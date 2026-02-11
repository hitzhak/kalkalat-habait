'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TransactionType } from '@/types';
import { Decimal } from '@prisma/client/runtime/library';

// ========== Zod Schemas ==========

const TransactionSchema = z.object({
  amount: z.number().positive('הסכום חייב להיות חיובי'),
  type: z.nativeEnum(TransactionType),
  categoryId: z.string().min(1, 'חובה לבחור קטגוריה'),
  date: z.date(),
  isFixed: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
});

const UpdateTransactionSchema = TransactionSchema.partial().extend({
  id: z.string().min(1),
});

const MonthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

// ========== Helper Functions ==========

/**
 * חישוב מספר שבוע בחודש לפי תאריך העסקה
 * שבוע 1: ימים 1-7
 * שבוע 2: ימים 8-14
 * שבוע 3: ימים 15-21
 * שבוע 4: ימים 22-28
 * שבוע 5: ימים 29-31
 */
function getWeekNumber(date: Date): number {
  const dayOfMonth = date.getDate();
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  if (dayOfMonth <= 28) return 4;
  return 5;
}

/**
 * המרת Decimal ל-number
 */
function decimalToNumber(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}

/**
 * בדיקה אם תאריך שייך לחודש ושנה מסוימים
 */
function isDateInMonth(date: Date, month: number, year: number): boolean {
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

// ========== Server Actions ==========

/**
 * 1. קבלת כל העסקאות לחודש מסוים
 * מחזיר את כל העסקאות ממוינות לפי תאריך (חדש קודם), כולל שם הקטגוריה ואייקון
 * בכניסה ראשונה לחודש חדש, יוצר אוטומטית עסקאות חוזרות מהחודש הקודם
 */
export async function getTransactions(month: number, year: number) {
  try {
    // ולידציה
    const validated = MonthYearSchema.parse({ month, year });

    // תאריכי התחלה וסיום החודש
    const startDate = new Date(validated.year, validated.month - 1, 1);
    const endDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    // בדיקה אם זו כניסה ראשונה לחודש חדש (אין עסקאות בחודש הנוכחי)
    // רק אם זה החודש הנוכחי או חודש עתידי - לא נצור עסקאות חוזרות לחודשי עבר
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isCurrentOrFutureMonth =
      validated.year > currentYear ||
      (validated.year === currentYear && validated.month >= currentMonth);

    const existingCount = await prisma.transaction.count({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // אם אין עסקאות בחודש הנוכחי/עתידי, יוצר עסקאות חוזרות מהחודש הקודם
    let recurringGenerated = null;
    if (existingCount === 0 && isCurrentOrFutureMonth) {
      try {
        const result = await generateRecurringTransactions(validated.month, validated.year);
        if (result.count > 0) {
          recurringGenerated = result;
        }
      } catch (error) {
        // לא נכשל אם יש שגיאה ביצירת עסקאות חוזרות - פשוט נמשיך
        console.error('Error generating recurring transactions:', error);
      }
    }

    // שליפת עסקאות (כולל אלה שנוצרו זה עתה)
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // המרת Decimal ל-number
    const transactionsData = transactions.map((tx) => ({
      ...tx,
      amount: decimalToNumber(tx.amount),
      date: tx.date.toISOString(),
    }));

    return {
      transactions: transactionsData,
      recurringGenerated,
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('שגיאה בטעינת העסקאות');
  }
}

/**
 * 2. יצירת עסקה חדשה
 * חישוב weekNumber אוטומטי מהתאריך
 */
export async function createTransaction(data: z.infer<typeof TransactionSchema>) {
  try {
    // ולידציה
    const validated = TransactionSchema.parse(data);

    // חישוב weekNumber אוטומטי (רק אם לא קבועה)
    const weekNumber = validated.isFixed ? null : getWeekNumber(validated.date);

    // יצירת העסקה
    const transaction = await prisma.transaction.create({
      data: {
        amount: validated.amount,
        type: validated.type,
        categoryId: validated.categoryId,
        date: validated.date,
        weekNumber,
        isFixed: validated.isFixed,
        notes: validated.notes,
        tags: validated.tags,
        isRecurring: validated.isRecurring,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
          },
        },
      },
    });

    return {
      ...transaction,
      amount: decimalToNumber(transaction.amount),
      date: transaction.date.toISOString(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.errors[0].message}`);
    }
    console.error('Error creating transaction:', error);
    throw new Error('שגיאה ביצירת העסקה');
  }
}

/**
 * 3. עדכון עסקה
 */
export async function updateTransaction(
  id: string,
  data: Partial<z.infer<typeof TransactionSchema>>
) {
  try {
    // ולידציה
    const validated = UpdateTransactionSchema.parse({ id, ...data });

    // בדיקה שהעסקה קיימת
    const existing = await prisma.transaction.findUnique({
      where: { id: validated.id },
    });

    if (!existing) {
      throw new Error('העסקה לא נמצאה');
    }

    // חישוב weekNumber אוטומטי אם יש תאריך חדש
    let weekNumber = existing.weekNumber;
    if (validated.date) {
      const isFixed = validated.isFixed ?? existing.isFixed;
      weekNumber = isFixed ? null : getWeekNumber(validated.date);
    } else if (validated.isFixed !== undefined && validated.isFixed !== existing.isFixed) {
      // אם שינינו את הסטטוס של isFixed
      weekNumber = validated.isFixed ? null : getWeekNumber(existing.date);
    }

    // עדכון העסקה
    const transaction = await prisma.transaction.update({
      where: { id: validated.id },
      data: {
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.type !== undefined && { type: validated.type }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.date !== undefined && { date: validated.date }),
        weekNumber,
        ...(validated.isFixed !== undefined && { isFixed: validated.isFixed }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
        ...(validated.tags !== undefined && { tags: validated.tags }),
        ...(validated.isRecurring !== undefined && { isRecurring: validated.isRecurring }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
          },
        },
      },
    });

    return {
      ...transaction,
      amount: decimalToNumber(transaction.amount),
      date: transaction.date.toISOString(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.errors[0].message}`);
    }
    console.error('Error updating transaction:', error);
    throw new Error('שגיאה בעדכון העסקה');
  }
}

/**
 * 4. מחיקת עסקה
 */
export async function deleteTransaction(id: string) {
  try {
    // בדיקה שהעסקה קיימת
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('העסקה לא נמצאה');
    }

    // מחיקת העסקה
    await prisma.transaction.delete({
      where: { id },
    });

    return { success: true, message: 'העסקה נמחקה בהצלחה' };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw new Error('שגיאה במחיקת העסקה');
  }
}

/**
 * 5. קבלת סיכום עסקאות לחודש
 * מחזיר: totalIncome, totalExpenses, balance, fixedExpenses, variableExpenses
 */
export async function getTransactionsSummary(month: number, year: number) {
  try {
    // ולידציה
    const validated = MonthYearSchema.parse({ month, year });

    // תאריכי התחלה וסיום החודש
    const startDate = new Date(validated.year, validated.month - 1, 1);
    const endDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    // שליפת כל העסקאות לחודש
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // חישוב סיכומים
    let totalIncome = 0;
    let totalExpenses = 0;
    let fixedExpenses = 0;
    let variableExpenses = 0;

    transactions.forEach((tx) => {
      const amount = decimalToNumber(tx.amount);

      if (tx.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else if (tx.type === TransactionType.EXPENSE) {
        totalExpenses += amount;
        if (tx.isFixed) {
          fixedExpenses += amount;
        } else {
          variableExpenses += amount;
        }
      }
    });

    const balance = totalIncome - totalExpenses;

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      fixedExpenses: Math.round(fixedExpenses * 100) / 100,
      variableExpenses: Math.round(variableExpenses * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching transactions summary:', error);
    throw new Error('שגיאה בטעינת סיכום העסקאות');
  }
}

/**
 * 6. יצירת עסקאות חוזרות לחודש מסוים
 * מחפש עסקאות מהחודש הקודם שמסומנות isRecurring=true,
 * בודק אם כבר קיימת עסקה חוזרת תואמת בחודש הנוכחי,
 * ואם לא - יוצר אוטומטית עם אותו סכום, קטגוריה, והגדרות.
 * מחזיר רשימת עסקאות שנוצרו.
 */
export async function generateRecurringTransactions(month: number, year: number) {
  try {
    // ולידציה
    const validated = MonthYearSchema.parse({ month, year });

    // חישוב החודש הקודם
    const currentDate = new Date(validated.year, validated.month - 1, 1);
    const previousDate = new Date(currentDate);
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.getMonth() + 1;
    const previousYear = previousDate.getFullYear();

    // תאריכי התחלה וסיום של החודש הקודם
    const prevStartDate = new Date(previousYear, previousMonth - 1, 1);
    const prevEndDate = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999);

    // תאריכי התחלה וסיום של החודש הנוכחי
    const currentStartDate = new Date(validated.year, validated.month - 1, 1);
    const currentEndDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    // שליפת עסקאות חוזרות מהחודש הקודם
    const recurringTransactions = await prisma.transaction.findMany({
      where: {
        isRecurring: true,
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
          },
        },
      },
    });

    if (recurringTransactions.length === 0) {
      return { created: [], count: 0 };
    }

    // שליפת עסקאות קיימות בחודש הנוכחי (לבדיקת כפילויות)
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: currentStartDate,
          lte: currentEndDate,
        },
        isRecurring: true,
      },
      select: {
        categoryId: true,
        amount: true,
        type: true,
        isFixed: true,
      },
    });

    // יצירת מפתח ייחודי לכל עסקה קיימת (למניעת כפילויות)
    const existingKeys = new Set(
      existingTransactions.map(
        (tx) => `${tx.categoryId}-${decimalToNumber(tx.amount)}-${tx.type}-${tx.isFixed}`
      )
    );

    const createdTransactions: Array<{
      id: string;
      amount: number;
      type: TransactionType;
      categoryId: string;
      date: string;
      isRecurring: boolean;
    }> = [];

    // יצירת עסקאות חדשות
    for (const recurringTx of recurringTransactions) {
      const amount = decimalToNumber(recurringTx.amount);
      const key = `${recurringTx.categoryId}-${amount}-${recurringTx.type}-${recurringTx.isFixed}`;

      // בדיקה אם כבר קיימת עסקה תואמת בחודש הנוכחי
      if (existingKeys.has(key)) {
        continue;
      }

      // חישוב תאריך העסקה החדשה (אותו יום בחודש, או היום האחרון אם החודש קצר יותר)
      const originalDay = recurringTx.date.getDate();
      const daysInMonth = new Date(validated.year, validated.month, 0).getDate();
      const targetDay = Math.min(originalDay, daysInMonth);
      const newDate = new Date(validated.year, validated.month - 1, targetDay);

      // חישוב weekNumber אוטומטי (רק אם לא קבועה)
      const weekNumber = recurringTx.isFixed ? null : getWeekNumber(newDate);

      // יצירת העסקה החדשה
      const newTransaction = await prisma.transaction.create({
        data: {
          amount: recurringTx.amount,
          type: recurringTx.type,
          categoryId: recurringTx.categoryId,
          date: newDate,
          weekNumber,
          isFixed: recurringTx.isFixed,
          notes: recurringTx.notes,
          tags: recurringTx.tags,
          isRecurring: true,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
              type: true,
              isFixed: true,
            },
          },
        },
      });

      createdTransactions.push({
        id: newTransaction.id,
        amount: decimalToNumber(newTransaction.amount),
        type: newTransaction.type,
        categoryId: newTransaction.categoryId,
        date: newTransaction.date.toISOString(),
        isRecurring: newTransaction.isRecurring,
      });
    }

    return {
      created: createdTransactions,
      count: createdTransactions.length,
    };
  } catch (error) {
    console.error('Error generating recurring transactions:', error);
    throw new Error('שגיאה ביצירת עסקאות חוזרות');
  }
}

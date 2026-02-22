'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TransactionType } from '@/types';
import { Prisma } from '@prisma/client';
import { getHouseholdId } from '@/lib/auth';

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
function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

// ========== Server Actions ==========

/**
 * 1. קבלת כל העסקאות לחודש מסוים
 */
export async function getTransactions(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month, year });

    const startDate = new Date(validated.year, validated.month - 1, 1);
    const endDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const isCurrentMonth =
      validated.year === currentYear && validated.month === currentMonth;

    const existingCount = await prisma.transaction.count({
      where: {
        householdId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let recurringGenerated = null;
    if (existingCount === 0 && isCurrentMonth) {
      try {
        const result = await generateRecurringTransactions(validated.month, validated.year);
        if (result.count > 0) {
          recurringGenerated = result;
        }
      } catch (error) {
        console.error('Error generating recurring transactions:', error);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
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
 */
export async function createTransaction(data: z.infer<typeof TransactionSchema>) {
  try {
    const householdId = await getHouseholdId();
    const validated = TransactionSchema.parse(data);

    const weekNumber = validated.isFixed ? null : getWeekNumber(validated.date);

    const transaction = await prisma.transaction.create({
      data: {
        householdId,
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
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
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
    const householdId = await getHouseholdId();
    const validated = UpdateTransactionSchema.parse({ id, ...data });

    const existing = await prisma.transaction.findFirst({
      where: { id: validated.id, householdId },
    });

    if (!existing) {
      throw new Error('העסקה לא נמצאה');
    }

    let weekNumber = existing.weekNumber;
    if (validated.date) {
      const isFixed = validated.isFixed ?? existing.isFixed;
      weekNumber = isFixed ? null : getWeekNumber(validated.date);
    } else if (validated.isFixed !== undefined && validated.isFixed !== existing.isFixed) {
      weekNumber = validated.isFixed ? null : getWeekNumber(existing.date);
    }

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
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
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
    const householdId = await getHouseholdId();
    const existing = await prisma.transaction.findFirst({
      where: { id, householdId },
    });

    if (!existing) {
      throw new Error('העסקה לא נמצאה');
    }

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
 */
export async function getTransactionsSummary(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month, year });

    const startDate = new Date(validated.year, validated.month - 1, 1);
    const endDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

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
 * טעינה מאוחדת של כל נתוני דף העסקאות — קריאה אחת במקום 2.
 */
export async function getTransactionsPageData(month: number, year: number) {
  const [transactionsResult, summary] = await Promise.all([
    getTransactions(month, year),
    getTransactionsSummary(month, year),
  ]);
  return { transactionsResult, summary };
}

/**
 * 6. יצירת עסקאות חוזרות לחודש מסוים
 */
export async function generateRecurringTransactions(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month, year });

    const currentDate = new Date(validated.year, validated.month - 1, 1);
    const previousDate = new Date(currentDate);
    previousDate.setMonth(previousDate.getMonth() - 1);
    const previousMonth = previousDate.getMonth() + 1;
    const previousYear = previousDate.getFullYear();

    const prevStartDate = new Date(previousYear, previousMonth - 1, 1);
    const prevEndDate = new Date(previousYear, previousMonth, 0, 23, 59, 59, 999);

    const currentStartDate = new Date(validated.year, validated.month - 1, 1);
    const currentEndDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    const recurringTransactions = await prisma.transaction.findMany({
      where: {
        householdId,
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

    const existingTransactions = await prisma.transaction.findMany({
      where: {
        householdId,
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

    for (const recurringTx of recurringTransactions) {
      const amount = decimalToNumber(recurringTx.amount);
      const key = `${recurringTx.categoryId}-${amount}-${recurringTx.type}-${recurringTx.isFixed}`;

      if (existingKeys.has(key)) {
        continue;
      }

      const originalDay = recurringTx.date.getDate();
      const daysInMonth = new Date(validated.year, validated.month, 0).getDate();
      const targetDay = Math.min(originalDay, daysInMonth);
      const newDate = new Date(validated.year, validated.month - 1, targetDay);

      const weekNumber = recurringTx.isFixed ? null : getWeekNumber(newDate);

      const newTransaction = await prisma.transaction.create({
        data: {
          householdId,
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
        type: newTransaction.type as TransactionType,
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

/**
 * קבלת עסקאות לפי קטגוריה וחודש
 */
export async function getTransactionsByCategory(categoryId: string, month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month, year });
    const startDate = new Date(validated.year, validated.month - 1, 1);
    const endDate = new Date(validated.year, validated.month, 0, 23, 59, 59, 999);

    const childCategories = await prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    const categoryIds = [categoryId, ...childCategories.map((c) => c.id)];

    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
        categoryId: { in: categoryIds },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true, isFixed: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return transactions.map((tx) => ({
      ...tx,
      amount: decimalToNumber(tx.amount),
      date: tx.date.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching category transactions:', error);
    throw new Error('שגיאה בטעינת עסקאות הקטגוריה');
  }
}

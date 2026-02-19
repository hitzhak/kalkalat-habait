'use server';

import { z } from 'zod';
import { prisma, withRetry } from '@/lib/db';
import { TransactionType } from '@/types';
import { Prisma } from '@prisma/client';
import { getHouseholdId } from '@/lib/auth';

// ========== Zod Schemas ==========

const MonthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

const BudgetItemSchema = z.object({
  categoryId: z.string().min(1, 'חובה לבחור קטגוריה'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  amount: z.number().min(0, 'הסכום חייב להיות אפס או חיובי'),
});

// ========== Helper Functions ==========

function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

/**
 * חישוב סה"כ הוצאות בפועל לקטגוריה בחודש — householdId required
 */
async function calculateActualSpent(
  categoryId: string,
  month: number,
  year: number,
  includeChildren: boolean = false,
  householdId: string
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const categoryIds = [categoryId];
  
  if (includeChildren) {
    const childCategories = await prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    categoryIds.push(...childCategories.map((child: { id: string }) => child.id));
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      householdId,
      categoryId: {
        in: categoryIds,
      },
      type: TransactionType.EXPENSE,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (sum: number, tx: { amount: Prisma.Decimal }) => sum + decimalToNumber(tx.amount),
    0
  );
}

async function getBudgetItem(householdId: string, categoryId: string, month: number, year: number) {
  return await prisma.budgetItem.findUnique({
    where: {
      householdId_categoryId_month_year: {
        householdId,
        categoryId,
        month,
        year,
      },
    },
  });
}

// ========== Server Actions ==========

/**
 * 1. קבלת כל פריטי התקציב לחודש
 */
export async function getBudgetForMonth(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month, year });

    const categories = await withRetry(() =>
      prisma.category.findMany({
        where: {
          type: 'EXPENSE',
          isActive: true,
          parentId: null,
          OR: [{ isDefault: true }, { householdId }],
        },
        include: {
          children: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          budgetItems: {
            where: {
              householdId,
              month: validated.month,
              year: validated.year,
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      })
    );

    if (categories.length === 0) {
      return [];
    }

    const budgetData = await Promise.all(
      categories.map(async (category) => {
        const budgetItem = category.budgetItems[0];
        const plannedAmount = budgetItem ? decimalToNumber(budgetItem.plannedAmount) : 0;

        const actualSpent = await calculateActualSpent(
          category.id,
          validated.month,
          validated.year,
          true,
          householdId
        );

        const remaining = plannedAmount - actualSpent;
        const usagePercent = plannedAmount > 0 ? (actualSpent / plannedAmount) * 100 : 0;

        let alertLevel: 'success' | 'warning' | 'danger' | 'error' = 'success';
        if (usagePercent >= 100) {
          alertLevel = 'error';
        } else if (usagePercent >= 90) {
          alertLevel = 'danger';
        } else if (usagePercent >= 70) {
          alertLevel = 'warning';
        }

        const childrenData = await Promise.all(
          category.children.map(async (child) => {
            const childBudgetItem = await getBudgetItem(
              householdId,
              child.id,
              validated.month,
              validated.year
            );
            const childPlanned = childBudgetItem
              ? decimalToNumber(childBudgetItem.plannedAmount)
              : 0;
            const childActual = await calculateActualSpent(
              child.id,
              validated.month,
              validated.year,
              false,
              householdId
            );
            const childRemaining = childPlanned - childActual;
            const childUsagePercent =
              childPlanned > 0 ? (childActual / childPlanned) * 100 : 0;

            return {
              id: child.id,
              name: child.name,
              icon: child.icon,
              color: child.color,
              plannedAmount: Math.round(childPlanned * 100) / 100,
              actualSpent: Math.round(childActual * 100) / 100,
              remaining: Math.round(childRemaining * 100) / 100,
              usagePercent: Math.round(childUsagePercent * 100) / 100,
            };
          })
        );

        return {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          plannedAmount: Math.round(plannedAmount * 100) / 100,
          actualSpent: Math.round(actualSpent * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          usagePercent: Math.round(usagePercent * 100) / 100,
          alertLevel,
          children: childrenData,
        };
      })
    );

    return budgetData;
  } catch (error) {
    console.error('Error fetching budget for month:', error);
    return [];
  }
}

/**
 * 2. יצירה/עדכון פריט תקציב
 */
export async function upsertBudgetItem(
  categoryId: string,
  month: number,
  year: number,
  amount: number
) {
  try {
    const householdId = await getHouseholdId();
    const validated = BudgetItemSchema.parse({ categoryId, month, year, amount });

    if (validated.amount === 0) {
      await prisma.budgetItem.deleteMany({
        where: {
          householdId,
          categoryId: validated.categoryId,
          month: validated.month,
          year: validated.year,
        },
      });

      return {
        success: true,
        message: 'פריט התקציב נמחק',
        budgetItem: null,
      };
    }

    const budgetItem = await prisma.budgetItem.upsert({
      where: {
        householdId_categoryId_month_year: {
          householdId,
          categoryId: validated.categoryId,
          month: validated.month,
          year: validated.year,
        },
      },
      create: {
        householdId,
        categoryId: validated.categoryId,
        month: validated.month,
        year: validated.year,
        plannedAmount: validated.amount,
      },
      update: {
        plannedAmount: validated.amount,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'התקציב עודכן בהצלחה',
      budgetItem: {
        ...budgetItem,
        plannedAmount: decimalToNumber(budgetItem.plannedAmount),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
    }
    console.error('Error upserting budget item:', error);
    throw new Error('שגיאה בעדכון פריט התקציב');
  }
}

/**
 * 3. העתקת כל פריטי התקציב מחודש קודם
 */
export async function copyBudgetFromPreviousMonth(targetMonth: number, targetYear: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month: targetMonth, year: targetYear });

    let previousMonth = validated.month - 1;
    let previousYear = validated.year;
    if (previousMonth < 1) {
      previousMonth = 12;
      previousYear -= 1;
    }

    const previousBudgetItems = await prisma.budgetItem.findMany({
      where: {
        householdId,
        month: previousMonth,
        year: previousYear,
      },
    });

    if (previousBudgetItems.length === 0) {
      return {
        success: false,
        message: 'לא נמצאו פריטי תקציב בחודש הקודם',
        count: 0,
      };
    }

    const existingItems = await prisma.budgetItem.findMany({
      where: {
        householdId,
        month: validated.month,
        year: validated.year,
      },
    });

    if (existingItems.length > 0) {
      await prisma.budgetItem.deleteMany({
        where: {
          householdId,
          month: validated.month,
          year: validated.year,
        },
      });
    }

    const newBudgetItems = previousBudgetItems.map((item) => ({
      householdId,
      categoryId: item.categoryId,
      month: validated.month,
      year: validated.year,
      plannedAmount: item.plannedAmount,
    }));

    await prisma.budgetItem.createMany({
      data: newBudgetItems,
    });

    return {
      success: true,
      message: `הועתקו ${previousBudgetItems.length} פריטי תקציב מ${previousMonth}/${previousYear}`,
      count: previousBudgetItems.length,
    };
  } catch (error) {
    console.error('Error copying budget from previous month:', error);
    throw new Error('שגיאה בהעתקת תקציב מחודש קודם');
  }
}

/**
 * 4. קבלת סיכום תקציב חודשי
 */
export async function getBudgetSummary(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const validated = MonthYearSchema.parse({ month, year });

    const budgetItems = await withRetry(() =>
      prisma.budgetItem.findMany({
        where: {
          householdId,
          month: validated.month,
          year: validated.year,
        },
        include: {
          category: {
            select: {
              id: true,
              parentId: true,
            },
          },
        },
      })
    );

    const mainCategoryItems = budgetItems.filter((item) => !item.category.parentId);

    const totalPlanned = mainCategoryItems.reduce(
      (sum, item) => sum + decimalToNumber(item.plannedAmount),
      0
    );

    let totalActual = 0;
    for (const item of mainCategoryItems) {
      const actual = await calculateActualSpent(
        item.categoryId,
        validated.month,
        validated.year,
        true,
        householdId
      );
      totalActual += actual;
    }

    const totalRemaining = totalPlanned - totalActual;
    const totalUsagePercent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return {
      totalPlanned: Math.round(totalPlanned * 100) / 100,
      totalActual: Math.round(totalActual * 100) / 100,
      totalRemaining: Math.round(totalRemaining * 100) / 100,
      totalUsagePercent: Math.round(totalUsagePercent * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    return {
      totalPlanned: 0,
      totalActual: 0,
      totalRemaining: 0,
      totalUsagePercent: 0,
    };
  }
}

/**
 * טעינה מאוחדת של כל נתוני דף התקציב — קריאה אחת במקום 2.
 */
export async function getBudgetPageData(month: number, year: number) {
  const [budget, summaryData] = await Promise.all([
    getBudgetForMonth(month, year),
    getBudgetSummary(month, year),
  ]);
  return { budget, summaryData };
}

'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TransactionType } from '@/types';
import { Decimal } from '@prisma/client/runtime/library';

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

/**
 * המרת Decimal ל-number
 */
function decimalToNumber(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}

/**
 * חישוב סה"כ הוצאות בפועל לקטגוריה בחודש
 */
async function calculateActualSpent(
  categoryId: string,
  month: number,
  year: number,
  includeChildren: boolean = false
): Promise<number> {
  // תאריכי התחלה וסיום החודש
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // שליפת הקטגוריה עם תתי-קטגוריות אם נדרש
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: includeChildren ? { children: true } : undefined,
  });

  if (!category) {
    return 0;
  }

  // רשימת IDs לחיפוש
  const categoryIds = [categoryId];
  if (includeChildren && category.children) {
    categoryIds.push(...category.children.map((child) => child.id));
  }

  // שליפת עסקאות
  const transactions = await prisma.transaction.findMany({
    where: {
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

  // סיכום הסכומים
  return transactions.reduce((sum, tx) => sum + decimalToNumber(tx.amount), 0);
}

/**
 * קבלת תקציב עבור קטגוריה בחודש (אם קיים)
 */
async function getBudgetItem(categoryId: string, month: number, year: number) {
  return await prisma.budgetItem.findUnique({
    where: {
      categoryId_month_year: {
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
 * מחזיר קטגוריות ראשיות בלבד, כולל חישוב הוצאות בפועל
 */
export async function getBudgetForMonth(month: number, year: number) {
  try {
    // ולידציה
    const validated = MonthYearSchema.parse({ month, year });

    // שליפת קטגוריות הוצאות ראשיות בלבד (parentId = null)
    const categories = await prisma.category.findMany({
      where: {
        type: 'EXPENSE',
        isActive: true,
        parentId: null,
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
            month: validated.month,
            year: validated.year,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // חישוב נתונים לכל קטגוריה
    const budgetData = await Promise.all(
      categories.map(async (category) => {
        // תקציב מתוכנן
        const budgetItem = category.budgetItems[0];
        const plannedAmount = budgetItem ? decimalToNumber(budgetItem.plannedAmount) : 0;

        // הוצאות בפועל (כולל תתי-קטגוריות)
        const actualSpent = await calculateActualSpent(
          category.id,
          validated.month,
          validated.year,
          true // כולל תתי-קטגוריות
        );

        // חישובים
        const remaining = plannedAmount - actualSpent;
        const usagePercent = plannedAmount > 0 ? (actualSpent / plannedAmount) * 100 : 0;

        // קביעת צבע התראה
        let alertLevel: 'success' | 'warning' | 'danger' | 'error' = 'success';
        if (usagePercent >= 100) {
          alertLevel = 'error';
        } else if (usagePercent >= 90) {
          alertLevel = 'danger';
        } else if (usagePercent >= 70) {
          alertLevel = 'warning';
        }

        // נתוני תתי-קטגוריות
        const childrenData = await Promise.all(
          category.children.map(async (child) => {
            const childBudgetItem = await getBudgetItem(
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
              false
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
    throw new Error('שגיאה בטעינת התקציב החודשי');
  }
}

/**
 * 2. יצירה/עדכון פריט תקציב
 * אם קיים - עדכון, אם לא - יצירה
 */
export async function upsertBudgetItem(
  categoryId: string,
  month: number,
  year: number,
  amount: number
) {
  try {
    // ולידציה
    const validated = BudgetItemSchema.parse({ categoryId, month, year, amount });

    // אם הסכום 0, נמחק את פריט התקציב (אם קיים)
    if (validated.amount === 0) {
      await prisma.budgetItem.deleteMany({
        where: {
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

    // יצירה או עדכון
    const budgetItem = await prisma.budgetItem.upsert({
      where: {
        categoryId_month_year: {
          categoryId: validated.categoryId,
          month: validated.month,
          year: validated.year,
        },
      },
      create: {
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
      throw new Error(`שגיאת ולידציה: ${error.errors[0].message}`);
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
    // ולידציה
    const validated = MonthYearSchema.parse({ month: targetMonth, year: targetYear });

    // חישוב חודש קודם
    let previousMonth = validated.month - 1;
    let previousYear = validated.year;
    if (previousMonth < 1) {
      previousMonth = 12;
      previousYear -= 1;
    }

    // שליפת פריטי תקציב מחודש קודם
    const previousBudgetItems = await prisma.budgetItem.findMany({
      where: {
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

    // בדיקה אם כבר קיימים פריטי תקציב בחודש היעד
    const existingItems = await prisma.budgetItem.findMany({
      where: {
        month: validated.month,
        year: validated.year,
      },
    });

    // אם יש פריטים קיימים, נמחק אותם תחילה
    if (existingItems.length > 0) {
      await prisma.budgetItem.deleteMany({
        where: {
          month: validated.month,
          year: validated.year,
        },
      });
    }

    // יצירת פריטי תקציב חדשים
    const newBudgetItems = previousBudgetItems.map((item) => ({
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
 * מחזיר: סה"כ מתוכנן, סה"כ בפועל, סה"כ נותר, אחוז כללי
 */
export async function getBudgetSummary(month: number, year: number) {
  try {
    // ולידציה
    const validated = MonthYearSchema.parse({ month, year });

    // שליפת כל פריטי התקציב לחודש
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
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
    });

    // סינון רק קטגוריות ראשיות (למנוע ספירה כפולה)
    const mainCategoryItems = budgetItems.filter((item) => !item.category.parentId);

    // חישוב סכומים מתוכננים
    const totalPlanned = mainCategoryItems.reduce(
      (sum, item) => sum + decimalToNumber(item.plannedAmount),
      0
    );

    // חישוב סכומים בפועל
    let totalActual = 0;
    for (const item of mainCategoryItems) {
      const actual = await calculateActualSpent(
        item.categoryId,
        validated.month,
        validated.year,
        true // כולל תתי-קטגוריות
      );
      totalActual += actual;
    }

    // חישובים כוללים
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
    throw new Error('שגיאה בטעינת סיכום התקציב');
  }
}

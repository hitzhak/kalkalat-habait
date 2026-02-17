'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getTransactionsSummary, getTransactions } from './transactions';

/**
 * המרת Decimal ל-number
 */
function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

/**
 * קבלת הוצאות לפי קטגוריה לחודש מסוים (לגרף עוגה)
 */
export async function getExpensesByCategory(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'EXPENSE',
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
            color: true,
          },
        },
      },
    });

    // קיבוץ לפי קטגוריה
    const categoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; categoryColor?: string; totalAmount: number }
    >();

    transactions.forEach((tx) => {
      const categoryId = tx.category.id;
      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        existing.totalAmount += decimalToNumber(tx.amount);
      } else {
        categoryMap.set(categoryId, {
          categoryId: tx.category.id,
          categoryName: tx.category.name,
          categoryColor: tx.category.color || undefined,
          totalAmount: decimalToNumber(tx.amount),
        });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    throw new Error('שגיאה בטעינת הוצאות לפי קטגוריה');
  }
}

/**
 * קבלת הוצאות משתנות לפי שבוע (לגרף עמודות)
 */
export async function getWeeklyVariableExpenses(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'EXPENSE',
        isFixed: false, // רק הוצאות משתנות!
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // קיבוץ לפי שבוע
    const weekMap = new Map<number, number>();

    transactions.forEach((tx) => {
      const week = tx.weekNumber || 0;
      if (week > 0) {
        const current = weekMap.get(week) || 0;
        weekMap.set(week, current + decimalToNumber(tx.amount));
      }
    });

    // יצירת מערך מסודר
    const weeklyData = [];
    for (let week = 1; week <= 5; week++) {
      weeklyData.push({
        week,
        amount: Math.round((weekMap.get(week) || 0) * 100) / 100,
      });
    }

    return weeklyData;
  } catch (error) {
    console.error('Error fetching weekly expenses:', error);
    throw new Error('שגיאה בטעינת הוצאות שבועיות');
  }
}

/**
 * קבלת התראות על חריגות תקציב (קטגוריות מעל 80%)
 */
export async function getBudgetAlerts(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // קבלת כל פריטי התקציב לחודש
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        month,
        year,
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

    // קבלת עסקאות לחודש
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // חישוב הוצאות לפי קטגוריה
    const spentByCategory = new Map<string, number>();
    transactions.forEach((tx) => {
      const current = spentByCategory.get(tx.categoryId) || 0;
      spentByCategory.set(tx.categoryId, current + decimalToNumber(tx.amount));
    });

    // יצירת מערך התראות
    const alerts = budgetItems
      .map((budget) => {
        const spent = spentByCategory.get(budget.categoryId) || 0;
        const budgetAmount = decimalToNumber(budget.plannedAmount);
        const usagePercent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        return {
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon || undefined,
          budgetAmount,
          spentAmount: spent,
          usagePercent: Math.round(usagePercent * 100) / 100,
        };
      })
      .filter((alert) => alert.usagePercent >= 80) // רק מעל 80%
      .sort((a, b) => b.usagePercent - a.usagePercent); // מהגבוה לנמוך

    return alerts;
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    throw new Error('שגיאה בטעינת התראות תקציב');
  }
}

/**
 * קבלת סיכום תקציב כללי (סה"כ תקציב מול סה"כ הוצאות)
 */
export async function getTotalBudgetSummary(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // סה"כ תקציב
    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        month,
        year,
      },
    });

    const totalBudget = budgetItems.reduce(
      (sum, item) => sum + decimalToNumber(item.plannedAmount),
      0
    );

    // סה"כ הוצאות
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSpent = transactions.reduce(
      (sum, tx) => sum + decimalToNumber(tx.amount),
      0
    );

    return {
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching total budget summary:', error);
    throw new Error('שגיאה בטעינת סיכום תקציב');
  }
}

/**
 * קבלת סיכום חודש קודם (להשוואה)
 */
export async function getPreviousMonthSummary(month: number, year: number) {
  try {
    // חישוב חודש קודם
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((tx) => {
      const amount = decimalToNumber(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    });

    const balance = totalIncome - totalExpenses;

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching previous month summary:', error);
    return { totalIncome: 0, totalExpenses: 0, balance: 0 };
  }
}

/**
 * סיכום זרימת תקציב לפי מחזור תשלום (payday).
 * מציג: הכנסות -> הוצאות קבועות (ב-payday) -> נותר למשתנות -> הוצאות משתנות בפועל -> יתרה סופית
 */
export async function getBudgetFlowSummary(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [settings, transactions] = await Promise.all([
      prisma.appSettings.findFirst(),
      prisma.transaction.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const payday = settings?.payday || 11;

    let totalIncome = 0;
    let fixedExpenses = 0;
    let variableExpenses = 0;
    const weeklySpending: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    transactions.forEach((tx) => {
      const amount = decimalToNumber(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += amount;
      } else if (tx.type === 'EXPENSE') {
        if (tx.isFixed) {
          fixedExpenses += amount;
        } else {
          variableExpenses += amount;
          const week = tx.weekNumber || 0;
          if (week >= 1 && week <= 5) {
            weeklySpending[week] += amount;
          }
        }
      }
    });

    const availableForVariable = totalIncome - fixedExpenses;
    const netRemaining = totalIncome - fixedExpenses - variableExpenses;

    return {
      payday,
      totalIncome: Math.round(totalIncome * 100) / 100,
      fixedExpenses: Math.round(fixedExpenses * 100) / 100,
      availableForVariable: Math.round(availableForVariable * 100) / 100,
      variableExpenses: Math.round(variableExpenses * 100) / 100,
      netRemaining: Math.round(netRemaining * 100) / 100,
      weeklySpending: Object.entries(weeklySpending).map(([week, amount]) => ({
        week: parseInt(week),
        amount: Math.round(amount * 100) / 100,
      })),
    };
  } catch (error) {
    console.error('Error fetching budget flow summary:', error);
    return {
      payday: 11,
      totalIncome: 0,
      fixedExpenses: 0,
      availableForVariable: 0,
      variableExpenses: 0,
      netRemaining: 0,
      weeklySpending: [1, 2, 3, 4, 5].map((week) => ({ week, amount: 0 })),
    };
  }
}

/**
 * טעינה מאוחדת של כל נתוני הדשבורד - קריאה אחת במקום 7.
 * מפחיתה עומס רשת, cold-start ב-Vercel, ומשפרת דרמטית את מהירות המעבר בין דפים.
 */
export async function getDashboardData(month: number, year: number) {
  const [
    summary,
    previousSummary,
    transactionsResult,
    expensesByCategory,
    weeklyExpenses,
    budgetSummary,
    alerts,
    budgetFlow,
  ] = await Promise.all([
    getTransactionsSummary(month, year),
    getPreviousMonthSummary(month, year),
    getTransactions(month, year),
    getExpensesByCategory(month, year),
    getWeeklyVariableExpenses(month, year),
    getTotalBudgetSummary(month, year),
    getBudgetAlerts(month, year),
    getBudgetFlowSummary(month, year),
  ]);

  return {
    summary,
    previousSummary,
    transactionsResult,
    expensesByCategory,
    weeklyExpenses,
    budgetSummary,
    alerts,
    budgetFlow,
  };
}

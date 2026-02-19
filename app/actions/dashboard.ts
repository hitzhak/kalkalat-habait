'use server';

import { prisma, withRetry } from '@/lib/db';
import { TransactionType } from '@/types';
import { Prisma } from '@prisma/client';
import { getTransactions } from './transactions';
import { getHouseholdId } from '@/lib/auth';

function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

/**
 * קבלת הוצאות לפי קטגוריה לחודש מסוים (לגרף עוגה)
 */
export async function getExpensesByCategory(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    const categoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; categoryColor?: string; totalAmount: number }
    >();

    transactions.forEach((tx) => {
      const categoryId = tx.category.id;
      if (categoryMap.has(categoryId)) {
        categoryMap.get(categoryId)!.totalAmount += decimalToNumber(tx.amount);
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
    const householdId = await getHouseholdId();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
        type: 'EXPENSE',
        isFixed: false,
        date: { gte: startDate, lte: endDate },
      },
    });

    const weekMap = new Map<number, number>();
    transactions.forEach((tx) => {
      const week = tx.weekNumber || 0;
      if (week > 0) {
        weekMap.set(week, (weekMap.get(week) || 0) + decimalToNumber(tx.amount));
      }
    });

    return Array.from({ length: 5 }, (_, i) => ({
      week: i + 1,
      amount: Math.round((weekMap.get(i + 1) || 0) * 100) / 100,
    }));
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
    const householdId = await getHouseholdId();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [budgetItems, transactions] = await Promise.all([
      prisma.budgetItem.findMany({
        where: { householdId, month, year },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
      }),
      prisma.transaction.findMany({
        where: {
          householdId,
          type: 'EXPENSE',
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const spentByCategory = new Map<string, number>();
    transactions.forEach((tx) => {
      spentByCategory.set(
        tx.categoryId,
        (spentByCategory.get(tx.categoryId) || 0) + decimalToNumber(tx.amount)
      );
    });

    return budgetItems
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
      .filter((alert) => alert.usagePercent >= 80)
      .sort((a, b) => b.usagePercent - a.usagePercent);
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
    const householdId = await getHouseholdId();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [budgetItems, transactions] = await Promise.all([
      prisma.budgetItem.findMany({
        where: { householdId, month, year, category: { parentId: null } },
      }),
      prisma.transaction.findMany({
        where: {
          householdId,
          type: 'EXPENSE',
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const totalBudget = budgetItems.reduce(
      (sum, item) => sum + decimalToNumber(item.plannedAmount),
      0
    );
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
    const householdId = await getHouseholdId();
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
        householdId,
        date: { gte: startDate, lte: endDate },
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

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching previous month summary:', error);
    return { totalIncome: 0, totalExpenses: 0, balance: 0 };
  }
}

/**
 * סיכום זרימת תקציב חודשי.
 */
export async function getBudgetFlowSummary(month: number, year: number) {
  try {
    const householdId = await getHouseholdId();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [settings, transactions] = await Promise.all([
      prisma.appSettings.findFirst({ where: { householdId } }),
      prisma.transaction.findMany({
        where: {
          householdId,
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
 * Optimized dashboard loader — fetches householdId once, shared data in
 * parallel, then computes all dashboard widgets from those shared datasets.
 * Reduces ~32 DB round-trips to ~7.
 */
export async function getDashboardData(month: number, year: number) {
  const householdId = await getHouseholdId();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth === 0) { prevMonth = 12; prevYear = year - 1; }
  const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
  const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

  const [
    allTransactions,
    prevTransactions,
    budgetItems,
    categories,
    settings,
    transactionsResult,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId, date: { gte: startDate, lte: endDate } },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true, type: true, isFixed: true, parentId: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { householdId, date: { gte: prevStartDate, lte: prevEndDate } },
    }),
    prisma.budgetItem.findMany({
      where: { householdId, month, year },
      include: { category: { select: { id: true, name: true, icon: true, color: true, parentId: true } } },
    }),
    withRetry(() =>
      prisma.category.findMany({
        where: {
          type: 'EXPENSE', isActive: true, parentId: null,
          OR: [{ isDefault: true }, { householdId }],
        },
        include: {
          children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
          budgetItems: { where: { householdId, month, year } },
        },
        orderBy: { sortOrder: 'asc' },
      })
    ),
    prisma.appSettings.findFirst({ where: { householdId } }),
    getTransactions(month, year),
  ]);

  // --- summary (from allTransactions) ---
  let totalIncome = 0, totalExpenses = 0, fixedExpenses = 0, variableExpenses = 0;
  const weeklySpending: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const spentByCategory = new Map<string, number>();
  const expCategoryMap = new Map<string, { categoryId: string; categoryName: string; categoryColor?: string; totalAmount: number }>();
  const weeklyVarMap = new Map<number, number>();

  for (const tx of allTransactions) {
    const amount = decimalToNumber(tx.amount);
    if (tx.type === TransactionType.INCOME) {
      totalIncome += amount;
    } else if (tx.type === TransactionType.EXPENSE) {
      totalExpenses += amount;
      if (tx.isFixed) { fixedExpenses += amount; } else {
        variableExpenses += amount;
        const week = tx.weekNumber || 0;
        if (week >= 1 && week <= 5) { weeklySpending[week] += amount; }
      }
      spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) || 0) + amount);

      const catId = tx.category.id;
      if (expCategoryMap.has(catId)) {
        expCategoryMap.get(catId)!.totalAmount += amount;
      } else {
        expCategoryMap.set(catId, {
          categoryId: catId,
          categoryName: tx.category.name,
          categoryColor: tx.category.color || undefined,
          totalAmount: amount,
        });
      }

      if (!tx.isFixed) {
        const w = tx.weekNumber || 0;
        if (w > 0) weeklyVarMap.set(w, (weeklyVarMap.get(w) || 0) + amount);
      }
    }
  }

  const summary = {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
    fixedExpenses: Math.round(fixedExpenses * 100) / 100,
    variableExpenses: Math.round(variableExpenses * 100) / 100,
  };

  // --- previous month summary ---
  let prevIncome = 0, prevExpenses = 0;
  for (const tx of prevTransactions) {
    const amount = decimalToNumber(tx.amount);
    if (tx.type === 'INCOME') prevIncome += amount; else prevExpenses += amount;
  }
  const previousSummary = {
    totalIncome: Math.round(prevIncome * 100) / 100,
    totalExpenses: Math.round(prevExpenses * 100) / 100,
    balance: Math.round((prevIncome - prevExpenses) * 100) / 100,
  };

  // --- expenses by category ---
  const expensesByCategory = Array.from(expCategoryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

  // --- weekly variable expenses ---
  const weeklyExpenses = Array.from({ length: 5 }, (_, i) => ({
    week: i + 1,
    amount: Math.round((weeklyVarMap.get(i + 1) || 0) * 100) / 100,
  }));

  // --- budget summary (total planned vs total spent) ---
  const mainBudgetItems = budgetItems.filter((b) => !b.category.parentId);
  const totalBudget = mainBudgetItems.reduce((s, b) => s + decimalToNumber(b.plannedAmount), 0);
  const budgetSummary = {
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalSpent: Math.round(totalExpenses * 100) / 100,
  };

  // --- budget alerts (>= 80%) ---
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
    .filter((a) => a.usagePercent >= 80)
    .sort((a, b) => b.usagePercent - a.usagePercent);

  // --- budget flow ---
  const payday = settings?.payday || 11;
  const availableForVariable = totalIncome - fixedExpenses;
  const netRemaining = totalIncome - fixedExpenses - variableExpenses;
  const budgetFlow = {
    payday,
    totalIncome: summary.totalIncome,
    fixedExpenses: summary.fixedExpenses,
    availableForVariable: Math.round(availableForVariable * 100) / 100,
    variableExpenses: summary.variableExpenses,
    netRemaining: Math.round(netRemaining * 100) / 100,
    weeklySpending: Object.entries(weeklySpending).map(([week, amount]) => ({
      week: parseInt(week),
      amount: Math.round(amount * 100) / 100,
    })),
  };

  // --- budget by category (from categories + spentMap) ---
  const budgetItemMap = new Map(budgetItems.map((b) => [b.categoryId, b]));
  const budgetByCategory = categories.map((category) => {
    const bi = category.budgetItems[0];
    const plannedAmount = bi ? decimalToNumber(bi.plannedAmount) : 0;
    const childIds = category.children.map((c) => c.id);
    let actualSpent = spentByCategory.get(category.id) || 0;
    for (const cid of childIds) actualSpent += spentByCategory.get(cid) || 0;

    const remaining = plannedAmount - actualSpent;
    const usagePercent = plannedAmount > 0 ? (actualSpent / plannedAmount) * 100 : 0;
    let alertLevel: 'success' | 'warning' | 'danger' | 'error' = 'success';
    if (usagePercent >= 100) alertLevel = 'error';
    else if (usagePercent >= 90) alertLevel = 'danger';
    else if (usagePercent >= 70) alertLevel = 'warning';

    const childrenData = category.children.map((child) => {
      const cbi = budgetItemMap.get(child.id);
      const childPlanned = cbi ? decimalToNumber(cbi.plannedAmount) : 0;
      const childActual = spentByCategory.get(child.id) || 0;
      const childRemaining = childPlanned - childActual;
      const childUsagePercent = childPlanned > 0 ? (childActual / childPlanned) * 100 : 0;
      return {
        id: child.id, name: child.name, icon: child.icon, color: child.color,
        plannedAmount: Math.round(childPlanned * 100) / 100,
        actualSpent: Math.round(childActual * 100) / 100,
        remaining: Math.round(childRemaining * 100) / 100,
        usagePercent: Math.round(childUsagePercent * 100) / 100,
      };
    });

    return {
      id: category.id, name: category.name, icon: category.icon, color: category.color,
      plannedAmount: Math.round(plannedAmount * 100) / 100,
      actualSpent: Math.round(actualSpent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      usagePercent: Math.round(usagePercent * 100) / 100,
      alertLevel,
      children: childrenData,
    };
  });

  return {
    summary,
    previousSummary,
    transactionsResult,
    expensesByCategory,
    weeklyExpenses,
    budgetSummary,
    alerts,
    budgetFlow,
    budgetByCategory,
  };
}

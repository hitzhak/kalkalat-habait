import { Transaction, BudgetItem } from '@/types';
import { ALERT_THRESHOLDS } from './constants';
import type { AlertLevel } from '@/types';

/**
 * חישוב סה"כ הכנסות לחודש
 */
export function calculateTotalIncome(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        tx.type === 'INCOME' &&
        txDate.getMonth() + 1 === month &&
        txDate.getFullYear() === year
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * חישוב סה"כ הוצאות לחודש
 */
export function calculateTotalExpenses(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        tx.type === 'EXPENSE' &&
        txDate.getMonth() + 1 === month &&
        txDate.getFullYear() === year
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * חישוב מאזן חודשי
 */
export function calculateBalance(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  const income = calculateTotalIncome(transactions, month, year);
  const expenses = calculateTotalExpenses(transactions, month, year);
  return income - expenses;
}

/**
 * חישוב הוצאות קבועות
 */
export function calculateFixedExpenses(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        tx.type === 'EXPENSE' &&
        tx.isFixed &&
        txDate.getMonth() + 1 === month &&
        txDate.getFullYear() === year
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * חישוב הוצאות משתנות
 */
export function calculateVariableExpenses(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  const total = calculateTotalExpenses(transactions, month, year);
  const fixed = calculateFixedExpenses(transactions, month, year);
  return total - fixed;
}

/**
 * חישוב ניצול תקציב לקטגוריה (באחוזים)
 */
export function calculateBudgetUsage(
  actualSpent: number,
  plannedBudget: number
): number {
  if (plannedBudget === 0) return 0;
  return (actualSpent / plannedBudget) * 100;
}

/**
 * חישוב סכום נותר מהתקציב
 */
export function calculateBudgetRemaining(
  actualSpent: number,
  plannedBudget: number
): number {
  return plannedBudget - actualSpent;
}

/**
 * חישוב הוצאות לפי שבוע
 */
export function calculateWeeklyExpenses(
  transactions: Transaction[],
  weekNumber: number,
  month: number,
  year: number
): number {
  return transactions
    .filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        tx.type === 'EXPENSE' &&
        !tx.isFixed &&
        tx.weekNumber === weekNumber &&
        txDate.getMonth() + 1 === month &&
        txDate.getFullYear() === year
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * חישוב ממוצע שבועי של הוצאות משתנות
 */
export function calculateWeeklyAverage(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  const variableExpenses = calculateVariableExpenses(transactions, month, year);
  const weeksInMonth = 4; // ממוצע 4 שבועות לחודש
  return variableExpenses / weeksInMonth;
}

/**
 * חישוב שינוי באחוזים לעומת חודש קודם
 */
export function calculateMonthlyChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * בדיקת התראות תקציב
 */
export function checkBudgetAlert(
  actualSpent: number,
  plannedBudget: number
): { level: AlertLevel; message: string } | null {
  const usage = calculateBudgetUsage(actualSpent, plannedBudget);

  if (usage >= ALERT_THRESHOLDS.EXCEEDED) {
    return {
      level: 'error',
      message: 'חרגת מהתקציב!',
    };
  }

  if (usage >= ALERT_THRESHOLDS.DANGER) {
    return {
      level: 'warning',
      message: 'כמעט הגעת לגבול התקציב',
    };
  }

  if (usage >= ALERT_THRESHOLDS.WARNING) {
    return {
      level: 'info',
      message: `שים לב, ניצלת ${Math.round(usage)}% מהתקציב`,
    };
  }

  return null;
}

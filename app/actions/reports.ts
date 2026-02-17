'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { TransactionType } from '@/types';
import { Prisma } from '@prisma/client';

// ========== Zod Schemas ==========

const MonthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

const ComparisonSchema = z.object({
  month1: z.number().int().min(1).max(12),
  year1: z.number().int().min(2020).max(2100),
  month2: z.number().int().min(1).max(12),
  year2: z.number().int().min(2020).max(2100),
});

const TrendSchema = z.object({
  months: z.number().int().min(1).max(24).default(12),
});

// ========== Helper Functions ==========

/**
 * המרת Decimal ל-number
 */
function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

/**
 * חישוב מספר שבוע בחודש
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
 * קבלת שם חודש בעברית
 */
function getHebrewMonthName(month: number): string {
  const months = [
    'ינואר',
    'פברואר',
    'מרץ',
    'אפריל',
    'מאי',
    'יוני',
    'יולי',
    'אוגוסט',
    'ספטמבר',
    'אוקטובר',
    'נובמבר',
    'דצמבר',
  ];
  return months[month - 1] || '';
}

// ========== Server Actions ==========

/**
 * 1. דוח חודשי מפורט
 * מחזיר: הכנסות, הוצאות קבועות, הוצאות משתנות, מאזן, הוצאות לפי קטגוריה, הוצאות לפי שבוע
 */
export async function getMonthlyReport(month: number, year: number) {
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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            isFixed: true,
            parentId: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // חישוב סיכומים כלליים
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

    // הוצאות לפי קטגוריה (קטגוריות ראשיות בלבד)
    const expensesByCategory: {
      [key: string]: {
        categoryId: string;
        categoryName: string;
        icon: string | null;
        color: string | null;
        amount: number;
      };
    } = {};

    transactions
      .filter((tx) => tx.type === TransactionType.EXPENSE)
      .forEach((tx) => {
        // אם זו תת-קטגוריה, נשתמש בקטגוריית האב
        const categoryId = tx.category.parentId || tx.category.id;

        if (!expensesByCategory[categoryId]) {
          // נמצא את הקטגוריה הראשית
          const mainCategory =
            tx.category.parentId === null
              ? tx.category
              : transactions.find((t) => t.category.id === tx.category.parentId)?.category ||
                tx.category;

          expensesByCategory[categoryId] = {
            categoryId,
            categoryName: mainCategory.name,
            icon: mainCategory.icon,
            color: mainCategory.color,
            amount: 0,
          };
        }

        expensesByCategory[categoryId].amount += decimalToNumber(tx.amount);
      });

    // המרה למערך ממוין
    const expensesByCategoryArray = Object.values(expensesByCategory)
      .map((cat) => ({
        ...cat,
        amount: Math.round(cat.amount * 100) / 100,
        percentage:
          totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // הוצאות לפי שבוע (הוצאות משתנות בלבד)
    const expensesByWeek: {
      [key: number]: number;
    } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    transactions
      .filter((tx) => tx.type === TransactionType.EXPENSE && !tx.isFixed)
      .forEach((tx) => {
        const weekNum = tx.weekNumber || getWeekNumber(tx.date);
        expensesByWeek[weekNum] = (expensesByWeek[weekNum] || 0) + decimalToNumber(tx.amount);
      });

    const expensesByWeekArray = Object.entries(expensesByWeek).map(([week, amount]) => ({
      week: parseInt(week),
      weekName: `שבוע ${week}`,
      amount: Math.round(amount * 100) / 100,
    }));

    // חישוב ממוצע שבועי (הוצאות משתנות)
    const weeksWithExpenses = expensesByWeekArray.filter((w) => w.amount > 0).length;
    const weeklyAverage =
      weeksWithExpenses > 0
        ? Math.round((variableExpenses / weeksWithExpenses) * 100) / 100
        : 0;

    return {
      month: validated.month,
      year: validated.year,
      monthName: getHebrewMonthName(validated.month),
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        fixedExpenses: Math.round(fixedExpenses * 100) / 100,
        variableExpenses: Math.round(variableExpenses * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        weeklyAverage,
      },
      expensesByCategory: expensesByCategoryArray,
      expensesByWeek: expensesByWeekArray,
      transactionCount: transactions.length,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
    }
    console.error('Error generating monthly report:', error);
    throw new Error('שגיאה ביצירת דוח חודשי');
  }
}

/**
 * 2. השוואת 2 חודשים
 * לכל קטגוריה — סכום בחודש 1, סכום בחודש 2, שינוי ב-₪ ובאחוזים
 */
export async function getComparisonData(
  month1: number,
  year1: number,
  month2: number,
  year2: number
) {
  try {
    // ולידציה
    const validated = ComparisonSchema.parse({ month1, year1, month2, year2 });

    // קבלת דוחות לשני החודשים
    const [report1, report2] = await Promise.all([
      getMonthlyReport(validated.month1, validated.year1),
      getMonthlyReport(validated.month2, validated.year2),
    ]);

    // בניית מפת קטגוריות מחודש 1
    const categoryMap: {
      [key: string]: {
        categoryId: string;
        categoryName: string;
        icon: string | null;
        color: string | null;
        month1Amount: number;
        month2Amount: number;
      };
    } = {};

    // הוספת קטגוריות מחודש 1
    report1.expensesByCategory.forEach((cat) => {
      categoryMap[cat.categoryId] = {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        icon: cat.icon,
        color: cat.color,
        month1Amount: cat.amount,
        month2Amount: 0,
      };
    });

    // הוספת קטגוריות מחודש 2
    report2.expensesByCategory.forEach((cat) => {
      if (categoryMap[cat.categoryId]) {
        categoryMap[cat.categoryId].month2Amount = cat.amount;
      } else {
        categoryMap[cat.categoryId] = {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          icon: cat.icon,
          color: cat.color,
          month1Amount: 0,
          month2Amount: cat.amount,
        };
      }
    });

    // חישוב שינויים
    const comparison = Object.values(categoryMap)
      .map((cat) => {
        const changeAmount = cat.month2Amount - cat.month1Amount;
        const changePercent =
          cat.month1Amount > 0 ? ((changeAmount / cat.month1Amount) * 100).toFixed(1) : null;

        return {
          ...cat,
          month1Amount: Math.round(cat.month1Amount * 100) / 100,
          month2Amount: Math.round(cat.month2Amount * 100) / 100,
          changeAmount: Math.round(changeAmount * 100) / 100,
          changePercent:
            changePercent !== null ? parseFloat(changePercent) : cat.month2Amount > 0 ? 100 : 0,
          changeDirection:
            (changeAmount > 0 ? 'increase' : changeAmount < 0 ? 'decrease' : 'same') as 'increase' | 'decrease' | 'same',
        };
      })
      .sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount));

    // סיכום השוואתי
    const summaryComparison = {
      month1: {
        month: validated.month1,
        year: validated.year1,
        monthName: getHebrewMonthName(validated.month1),
        totalIncome: report1.summary.totalIncome,
        totalExpenses: report1.summary.totalExpenses,
        balance: report1.summary.balance,
      },
      month2: {
        month: validated.month2,
        year: validated.year2,
        monthName: getHebrewMonthName(validated.month2),
        totalIncome: report2.summary.totalIncome,
        totalExpenses: report2.summary.totalExpenses,
        balance: report2.summary.balance,
      },
      changes: {
        incomeChange: Math.round((report2.summary.totalIncome - report1.summary.totalIncome) * 100) / 100,
        expensesChange: Math.round((report2.summary.totalExpenses - report1.summary.totalExpenses) * 100) / 100,
        balanceChange: Math.round((report2.summary.balance - report1.summary.balance) * 100) / 100,
        incomeChangePercent:
          report1.summary.totalIncome > 0
            ? Math.round(
                ((report2.summary.totalIncome - report1.summary.totalIncome) /
                  report1.summary.totalIncome) *
                  10000
              ) / 100
            : 0,
        expensesChangePercent:
          report1.summary.totalExpenses > 0
            ? Math.round(
                ((report2.summary.totalExpenses - report1.summary.totalExpenses) /
                  report1.summary.totalExpenses) *
                  10000
              ) / 100
            : 0,
      },
    };

    return {
      summary: summaryComparison,
      categoryComparison: comparison,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
    }
    console.error('Error generating comparison data:', error);
    throw new Error('שגיאה ביצירת השוואת חודשים');
  }
}

/**
 * 3. נתוני מגמה ל-N חודשים אחורה
 * הכנסות והוצאות כולל לכל חודש
 */
export async function getTrendData(months: number = 12) {
  try {
    // ולידציה
    const validated = TrendSchema.parse({ months });

    const today = new Date();
    const trendData = [];

    // איסוף נתונים לכל חודש
    for (let i = validated.months - 1; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      // תאריכי התחלה וסיום
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // שליפת עסקאות
      const transactions = await prisma.transaction.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // חישוב הכנסות והוצאות
      let income = 0;
      let expenses = 0;

      transactions.forEach((tx) => {
        const amount = decimalToNumber(tx.amount);
        if (tx.type === TransactionType.INCOME) {
          income += amount;
        } else if (tx.type === TransactionType.EXPENSE) {
          expenses += amount;
        }
      });

      trendData.push({
        month,
        year,
        monthName: getHebrewMonthName(month),
        monthYear: `${getHebrewMonthName(month)} ${year}`,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        balance: Math.round((income - expenses) * 100) / 100,
      });
    }

    // חישוב ממוצעים
    const avgIncome =
      trendData.length > 0
        ? Math.round((trendData.reduce((sum, d) => sum + d.income, 0) / trendData.length) * 100) /
          100
        : 0;
    const avgExpenses =
      trendData.length > 0
        ? Math.round(
            (trendData.reduce((sum, d) => sum + d.expenses, 0) / trendData.length) * 100
          ) / 100
        : 0;

    return {
      data: trendData,
      statistics: {
        avgIncome,
        avgExpenses,
        avgBalance: Math.round((avgIncome - avgExpenses) * 100) / 100,
        totalMonths: trendData.length,
        highestIncome: trendData.length > 0 ? Math.max(...trendData.map((d) => d.income)) : 0,
        highestExpenses: trendData.length > 0 ? Math.max(...trendData.map((d) => d.expenses)) : 0,
        lowestIncome: trendData.length > 0 ? Math.min(...trendData.map((d) => d.income)) : 0,
        lowestExpenses: trendData.length > 0 ? Math.min(...trendData.map((d) => d.expenses)) : 0,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
    }
    console.error('Error generating trend data:', error);
    throw new Error('שגיאה ביצירת נתוני מגמה');
  }
}

/**
 * טעינה מאוחדת של כל נתוני דף הדוחות — קריאה אחת במקום 3.
 */
export async function getReportsPageData(
  currentMonth: number,
  currentYear: number,
  compMonth1: number,
  compYear1: number,
  compMonth2: number,
  compYear2: number,
  trendMonths: number = 12
) {
  const [monthlyReport, comparisonData, trendData] = await Promise.all([
    getMonthlyReport(currentMonth, currentYear),
    getComparisonData(compMonth1, compYear1, compMonth2, compYear2),
    getTrendData(trendMonths),
  ]);
  return { monthlyReport, comparisonData, trendData };
}

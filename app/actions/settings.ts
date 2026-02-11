'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { CategoryType } from '@/types';
import { Decimal } from '@prisma/client/runtime/library';

// ========== Zod Schemas ==========

const SettingsSchema = z.object({
  payday: z.number().int().min(1).max(31),
  currency: z.string().default('ILS'),
  startMonth: z.number().int().min(1).max(12).default(1),
  weekStartDay: z.number().int().min(0).max(6).default(0),
});

const CategorySchema = z.object({
  name: z.string().min(1, 'שם הקטגוריה חובה'),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.nativeEnum(CategoryType),
  isFixed: z.boolean().default(false),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

const UpdateCategorySchema = CategorySchema.partial().extend({
  id: z.string().min(1),
});

// ========== Helper Functions ==========

/**
 * המרת Decimal ל-number
 */
function decimalToNumber(decimal: Decimal): number {
  return parseFloat(decimal.toString());
}

// ========== Server Actions ==========

/**
 * 1. קבלת הגדרות האפליקציה
 */
export async function getSettings() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    // אם אין הגדרות, צור ברירת מחדל
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'default',
          payday: 11,
          currency: 'ILS',
          startMonth: 1,
          weekStartDay: 0,
        },
      });
    }

    return {
      payday: settings.payday,
      currency: settings.currency,
      startMonth: settings.startMonth,
      weekStartDay: settings.weekStartDay,
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw new Error('שגיאה בטעינת ההגדרות');
  }
}

/**
 * 2. עדכון הגדרות
 */
export async function updateSettings(data: z.infer<typeof SettingsSchema>) {
  try {
    // ולידציה
    const validated = SettingsSchema.parse(data);

    // עדכון או יצירה
    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...validated,
      },
      update: validated,
    });

    return {
      success: true,
      message: 'ההגדרות עודכנו בהצלחה',
      settings: {
        payday: settings.payday,
        currency: settings.currency,
        startMonth: settings.startMonth,
        weekStartDay: settings.weekStartDay,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.errors[0].message}`);
    }
    console.error('Error updating settings:', error);
    throw new Error('שגיאה בעדכון ההגדרות');
  }
}

/**
 * 3. קבלת כל הקטגוריות לניהול (כולל לא פעילות)
 */
export async function getAllCategoriesForManagement() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            transactions: true,
            budgetItems: true,
          },
        },
      },
      orderBy: [
        {
          type: 'asc', // INCOME קודם
        },
        {
          parentId: 'asc', // קטגוריות ראשיות קודם
        },
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type,
      isFixed: cat.isFixed,
      parentId: cat.parentId,
      parentName: cat.parent?.name || null,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      isDefault: cat.isDefault,
      createdAt: cat.createdAt.toISOString(),
      transactionCount: cat._count.transactions,
      budgetItemCount: cat._count.budgetItems,
      childrenCount: cat.children.length,
    }));
  } catch (error) {
    console.error('Error fetching categories for management:', error);
    throw new Error('שגיאה בטעינת הקטגוריות');
  }
}

/**
 * 4. יצירת קטגוריה חדשה
 */
export async function createCategory(data: z.infer<typeof CategorySchema>) {
  try {
    // ולידציה
    const validated = CategorySchema.parse(data);

    // בדיקה שהקטגוריה לא קיימת כבר
    const existing = await prisma.category.findFirst({
      where: {
        name: validated.name,
        type: validated.type,
        parentId: validated.parentId || null,
      },
    });

    if (existing) {
      throw new Error('קטגוריה עם שם זה כבר קיימת');
    }

    // יצירת הקטגוריה
    const category = await prisma.category.create({
      data: {
        ...validated,
        isDefault: false, // קטגוריות שנוצרות על ידי המשתמש אינן קטגוריות מערכת
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'הקטגוריה נוצרה בהצלחה',
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        isFixed: category.isFixed,
        parentId: category.parentId,
        parentName: category.parent?.name || null,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        isDefault: category.isDefault,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.errors[0].message}`);
    }
    console.error('Error creating category:', error);
    throw error instanceof Error ? error : new Error('שגיאה ביצירת הקטגוריה');
  }
}

/**
 * 5. עדכון קטגוריה
 */
export async function updateCategory(
  id: string,
  data: Partial<z.infer<typeof CategorySchema>>
) {
  try {
    // ולידציה
    const validated = UpdateCategorySchema.parse({ id, ...data });

    // בדיקה שהקטגוריה קיימת
    const existing = await prisma.category.findUnique({
      where: { id: validated.id },
    });

    if (!existing) {
      throw new Error('הקטגוריה לא נמצאה');
    }

    // בדיקה אם זו קטגוריית מערכת - לא ניתן לשנות isDefault
    if (existing.isDefault && validated.isDefault === false) {
      throw new Error('לא ניתן לשנות קטגוריית מערכת');
    }

    // עדכון הקטגוריה
    const category = await prisma.category.update({
      where: { id: validated.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.icon !== undefined && { icon: validated.icon }),
        ...(validated.color !== undefined && { color: validated.color }),
        ...(validated.type !== undefined && { type: validated.type }),
        ...(validated.isFixed !== undefined && { isFixed: validated.isFixed }),
        ...(validated.parentId !== undefined && { parentId: validated.parentId }),
        ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'הקטגוריה עודכנה בהצלחה',
      category: {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        isFixed: category.isFixed,
        parentId: category.parentId,
        parentName: category.parent?.name || null,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        isDefault: category.isDefault,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`שגיאת ולידציה: ${error.errors[0].message}`);
    }
    console.error('Error updating category:', error);
    throw error instanceof Error ? error : new Error('שגיאה בעדכון הקטגוריה');
  }
}

/**
 * 6. הפעלה/כיבוי קטגוריה (toggle isActive)
 */
export async function toggleCategory(id: string) {
  try {
    // בדיקה שהקטגוריה קיימת
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error('הקטגוריה לא נמצאה');
    }

    // עדכון הסטטוס
    const updated = await prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
      },
    });

    return {
      success: true,
      message: `הקטגוריה ${updated.isActive ? 'הופעלה' : 'כובתה'} בהצלחה`,
      category: {
        id: updated.id,
        name: updated.name,
        isActive: updated.isActive,
      },
    };
  } catch (error) {
    console.error('Error toggling category:', error);
    throw error instanceof Error ? error : new Error('שגיאה בשינוי סטטוס הקטגוריה');
  }
}

/**
 * 7. ייצוא כל הנתונים כ-JSON (גיבוי)
 */
export async function exportAllData() {
  try {
    // שליפת כל הנתונים
    const [
      settings,
      categories,
      transactions,
      budgetItems,
      savingsGoals,
      savingsDeposits,
      loans,
      loanPayments,
    ] = await Promise.all([
      prisma.appSettings.findMany(),
      prisma.category.findMany({
        orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
      }),
      prisma.transaction.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.budgetItem.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.savingsGoal.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savingsDeposit.findMany({
        orderBy: { date: 'desc' },
      }),
      prisma.loan.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loanPayment.findMany({
        orderBy: { date: 'desc' },
      }),
    ]);

    // המרת Decimal ל-number
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: settings.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      categories: categories.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      transactions: transactions.map((t) => ({
        ...t,
        amount: decimalToNumber(t.amount),
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      budgetItems: budgetItems.map((b) => ({
        ...b,
        plannedAmount: decimalToNumber(b.plannedAmount),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
      savingsGoals: savingsGoals.map((sg) => ({
        ...sg,
        targetAmount: decimalToNumber(sg.targetAmount),
        currentAmount: decimalToNumber(sg.currentAmount),
        monthlyTarget: sg.monthlyTarget ? decimalToNumber(sg.monthlyTarget) : null,
        targetDate: sg.targetDate?.toISOString() || null,
        createdAt: sg.createdAt.toISOString(),
        updatedAt: sg.updatedAt.toISOString(),
      })),
      savingsDeposits: savingsDeposits.map((sd) => ({
        ...sd,
        amount: decimalToNumber(sd.amount),
        date: sd.date.toISOString(),
        createdAt: sd.createdAt.toISOString(),
      })),
      loans: loans.map((l) => ({
        ...l,
        originalAmount: decimalToNumber(l.originalAmount),
        remainingAmount: decimalToNumber(l.remainingAmount),
        monthlyPayment: decimalToNumber(l.monthlyPayment),
        interestRate: l.interestRate ? decimalToNumber(l.interestRate) : null,
        startDate: l.startDate.toISOString(),
        endDate: l.endDate?.toISOString() || null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      loanPayments: loanPayments.map((lp) => ({
        ...lp,
        amount: decimalToNumber(lp.amount),
        principalAmount: lp.principalAmount ? decimalToNumber(lp.principalAmount) : null,
        interestAmount: lp.interestAmount ? decimalToNumber(lp.interestAmount) : null,
        date: lp.date.toISOString(),
        createdAt: lp.createdAt.toISOString(),
      })),
    };

    return {
      success: true,
      data: exportData,
      filename: `backup-${new Date().toISOString().split('T')[0]}.json`,
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('שגיאה בייצוא הנתונים');
  }
}

/**
 * 8. ייבוא נתונים מ-JSON (שחזור)
 * אזהרה: פעולה זו תחליף את כל הנתונים הקיימים!
 */
export async function importData(jsonData: any) {
  try {
    // ולידציה בסיסית
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('קובץ JSON לא תקין');
    }

    // בדיקת גרסה
    if (!jsonData.version) {
      throw new Error('קובץ גיבוי לא מזוהה - חסר שדה version');
    }

    // התחלת טרנזקציה
    await prisma.$transaction(async (tx) => {
      // מחיקת כל הנתונים הקיימים (למעט קטגוריות מערכת)
      await tx.loanPayment.deleteMany({});
      await tx.loan.deleteMany({});
      await tx.savingsDeposit.deleteMany({});
      await tx.savingsGoal.deleteMany({});
      await tx.budgetItem.deleteMany({});
      await tx.transaction.deleteMany({});
      
      // מחיקת קטגוריות לא-מערכת בלבד
      await tx.category.deleteMany({
        where: {
          isDefault: false,
        },
      });

      // ייבוא הגדרות
      if (jsonData.settings && Array.isArray(jsonData.settings) && jsonData.settings.length > 0) {
        const settingsData = jsonData.settings[0];
        await tx.appSettings.upsert({
          where: { id: 'default' },
          create: {
            id: 'default',
            payday: settingsData.payday || 11,
            currency: settingsData.currency || 'ILS',
            startMonth: settingsData.startMonth || 1,
            weekStartDay: settingsData.weekStartDay || 0,
          },
          update: {
            payday: settingsData.payday || 11,
            currency: settingsData.currency || 'ILS',
            startMonth: settingsData.startMonth || 1,
            weekStartDay: settingsData.weekStartDay || 0,
          },
        });
      }

      // ייבוא קטגוריות (רק לא-מערכת, כי מערכת כבר קיימות)
      if (jsonData.categories && Array.isArray(jsonData.categories)) {
        const customCategories = jsonData.categories.filter((c: any) => !c.isDefault);
        if (customCategories.length > 0) {
          await tx.category.createMany({
            data: customCategories.map((c: any) => ({
              id: c.id,
              name: c.name,
              icon: c.icon || null,
              color: c.color || null,
              type: c.type,
              isFixed: c.isFixed || false,
              parentId: c.parentId || null,
              sortOrder: c.sortOrder || 0,
              isActive: c.isActive !== undefined ? c.isActive : true,
              isDefault: false,
              createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            })),
            skipDuplicates: true,
          });
        }
      }

      // ייבוא עסקאות
      if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
        // צריך למפות categoryId לפי שם הקטגוריה או ID
        for (const tx of jsonData.transactions) {
          let categoryId = tx.categoryId;
          
          // אם יש category object, נשתמש ב-ID שלו
          if (tx.category && tx.category.id) {
            categoryId = tx.category.id;
          } else if (tx.category && tx.category.name) {
            // נחפש לפי שם
            const category = await tx.category.findFirst({
              where: { name: tx.category.name },
            });
            if (category) {
              categoryId = category.id;
            }
          }

          if (categoryId) {
            await tx.transaction.create({
              data: {
                id: tx.id,
                amount: tx.amount,
                type: tx.type,
                categoryId,
                date: new Date(tx.date),
                weekNumber: tx.weekNumber || null,
                isFixed: tx.isFixed || false,
                notes: tx.notes || null,
                tags: tx.tags || [],
                isRecurring: tx.isRecurring || false,
                createdAt: tx.createdAt ? new Date(tx.createdAt) : new Date(),
                updatedAt: tx.updatedAt ? new Date(tx.updatedAt) : new Date(),
              },
            });
          }
        }
      }

      // ייבוא תקציבים
      if (jsonData.budgetItems && Array.isArray(jsonData.budgetItems)) {
        for (const bi of jsonData.budgetItems) {
          let categoryId = bi.categoryId;
          
          if (bi.category && bi.category.id) {
            categoryId = bi.category.id;
          } else if (bi.category && bi.category.name) {
            const category = await tx.category.findFirst({
              where: { name: bi.category.name },
            });
            if (category) {
              categoryId = category.id;
            }
          }

          if (categoryId) {
            await tx.budgetItem.create({
              data: {
                id: bi.id,
                categoryId,
                month: bi.month,
                year: bi.year,
                plannedAmount: bi.plannedAmount,
                createdAt: bi.createdAt ? new Date(bi.createdAt) : new Date(),
                updatedAt: bi.updatedAt ? new Date(bi.updatedAt) : new Date(),
              },
            });
          }
        }
      }

      // ייבוא מטרות חיסכון
      if (jsonData.savingsGoals && Array.isArray(jsonData.savingsGoals)) {
        await tx.savingsGoal.createMany({
          data: jsonData.savingsGoals.map((sg: any) => ({
            id: sg.id,
            name: sg.name,
            icon: sg.icon || null,
            targetAmount: sg.targetAmount,
            currentAmount: sg.currentAmount || 0,
            targetDate: sg.targetDate ? new Date(sg.targetDate) : null,
            monthlyTarget: sg.monthlyTarget || null,
            color: sg.color || null,
            isCompleted: sg.isCompleted || false,
            createdAt: sg.createdAt ? new Date(sg.createdAt) : new Date(),
            updatedAt: sg.updatedAt ? new Date(sg.updatedAt) : new Date(),
          })),
          skipDuplicates: true,
        });
      }

      // ייבוא הפקדות חיסכון
      if (jsonData.savingsDeposits && Array.isArray(jsonData.savingsDeposits)) {
        await tx.savingsDeposit.createMany({
          data: jsonData.savingsDeposits.map((sd: any) => ({
            id: sd.id,
            goalId: sd.goalId,
            amount: sd.amount,
            date: new Date(sd.date),
            notes: sd.notes || null,
            createdAt: sd.createdAt ? new Date(sd.createdAt) : new Date(),
          })),
          skipDuplicates: true,
        });
      }

      // ייבוא הלוואות
      if (jsonData.loans && Array.isArray(jsonData.loans)) {
        await tx.loan.createMany({
          data: jsonData.loans.map((l: any) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            originalAmount: l.originalAmount,
            remainingAmount: l.remainingAmount,
            monthlyPayment: l.monthlyPayment,
            interestRate: l.interestRate || null,
            startDate: new Date(l.startDate),
            endDate: l.endDate ? new Date(l.endDate) : null,
            totalPayments: l.totalPayments || null,
            remainingPayments: l.remainingPayments || null,
            notes: l.notes || null,
            isActive: l.isActive !== undefined ? l.isActive : true,
            createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
            updatedAt: l.updatedAt ? new Date(l.updatedAt) : new Date(),
          })),
          skipDuplicates: true,
        });
      }

      // ייבוא תשלומי הלוואה
      if (jsonData.loanPayments && Array.isArray(jsonData.loanPayments)) {
        await tx.loanPayment.createMany({
          data: jsonData.loanPayments.map((lp: any) => ({
            id: lp.id,
            loanId: lp.loanId,
            amount: lp.amount,
            principalAmount: lp.principalAmount || null,
            interestAmount: lp.interestAmount || null,
            date: new Date(lp.date),
            notes: lp.notes || null,
            createdAt: lp.createdAt ? new Date(lp.createdAt) : new Date(),
          })),
          skipDuplicates: true,
        });
      }
    });

    return {
      success: true,
      message: 'הנתונים יובאו בהצלחה',
    };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error instanceof Error ? error : new Error('שגיאה בייבוא הנתונים');
  }
}

/**
 * 9. איפוס כל הנתונים (מוחק הכל)
 */
export async function resetAllData() {
  try {
    await prisma.$transaction(async (tx) => {
      // מחיקת כל הנתונים בסדר הנכון (למניעת שגיאות foreign key)
      await tx.loanPayment.deleteMany({});
      await tx.loan.deleteMany({});
      await tx.savingsDeposit.deleteMany({});
      await tx.savingsGoal.deleteMany({});
      await tx.budgetItem.deleteMany({});
      await tx.transaction.deleteMany({});
      
      // מחיקת קטגוריות לא-מערכת בלבד
      await tx.category.deleteMany({
        where: {
          isDefault: false,
        },
      });

      // איפוס הגדרות לברירת מחדל
      await tx.appSettings.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          payday: 11,
          currency: 'ILS',
          startMonth: 1,
          weekStartDay: 0,
        },
        update: {
          payday: 11,
          currency: 'ILS',
          startMonth: 1,
          weekStartDay: 0,
        },
      });
    });

    return {
      success: true,
      message: 'כל הנתונים אופסו בהצלחה',
    };
  } catch (error) {
    console.error('Error resetting data:', error);
    throw new Error('שגיאה באיפוס הנתונים');
  }
}

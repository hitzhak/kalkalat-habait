'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { CategoryType } from '@/types';
import { Prisma } from '@prisma/client';
import { getHouseholdId } from '@/lib/auth';

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

function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

// ========== Server Actions ==========

/**
 * 1. קבלת הגדרות האפליקציה
 */
export async function getSettings() {
  try {
    const householdId = await getHouseholdId();
    let settings = await prisma.appSettings.findUnique({
      where: { householdId },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          householdId,
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
    const householdId = await getHouseholdId();
    const validated = SettingsSchema.parse(data);

    const settings = await prisma.appSettings.upsert({
      where: { householdId },
      create: {
        householdId,
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
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
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
    const householdId = await getHouseholdId();
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { householdId }],
      },
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
          type: 'asc',
        },
        {
          parentId: 'asc',
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
    const householdId = await getHouseholdId();
    const validated = CategorySchema.parse(data);

    const existing = await prisma.category.findFirst({
      where: {
        name: validated.name,
        type: validated.type,
        parentId: validated.parentId || null,
        OR: [{ householdId }, { isDefault: true }],
      },
    });

    if (existing) {
      throw new Error('קטגוריה עם שם זה כבר קיימת');
    }

    const category = await prisma.category.create({
      data: {
        ...validated,
        householdId,
        isDefault: false,
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
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
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
    const householdId = await getHouseholdId();
    const validated = UpdateCategorySchema.parse({ id, ...data });

    const existing = await prisma.category.findFirst({
      where: { id: validated.id, householdId },
    });

    if (!existing) {
      throw new Error('הקטגוריה לא נמצאה');
    }

    if (existing.isDefault) {
      throw new Error('לא ניתן לשנות קטגוריית מערכת');
    }

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
      throw new Error(`שגיאת ולידציה: ${error.issues[0].message}`);
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
    const householdId = await getHouseholdId();
    const category = await prisma.category.findFirst({
      where: { id, OR: [{ householdId }, { isDefault: true }] },
    });

    if (!category) {
      throw new Error('הקטגוריה לא נמצאה');
    }

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
    const householdId = await getHouseholdId();
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
      prisma.appSettings.findMany({ where: { householdId } }),
      prisma.category.findMany({
        where: { OR: [{ householdId }, { isDefault: true }] },
        orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
      }),
      prisma.transaction.findMany({
        where: { householdId },
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
        where: { householdId },
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
        where: { householdId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.savingsDeposit.findMany({
        where: { goal: { householdId } },
        orderBy: { date: 'desc' },
      }),
      prisma.loan.findMany({
        where: { householdId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loanPayment.findMany({
        where: { loan: { householdId } },
        orderBy: { date: 'desc' },
      }),
    ]);

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
 */
export async function importData(jsonData: any) {
  try {
    const householdId = await getHouseholdId();
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('קובץ JSON לא תקין');
    }

    if (!jsonData.version) {
      throw new Error('קובץ גיבוי לא מזוהה - חסר שדה version');
    }

    await prisma.$transaction(async (tx) => {
      await tx.loanPayment.deleteMany({ where: { loan: { householdId } } });
      await tx.loan.deleteMany({ where: { householdId } });
      await tx.savingsDeposit.deleteMany({ where: { goal: { householdId } } });
      await tx.savingsGoal.deleteMany({ where: { householdId } });
      await tx.budgetItem.deleteMany({ where: { householdId } });
      await tx.transaction.deleteMany({ where: { householdId } });
      
      await tx.category.deleteMany({
        where: { householdId, isDefault: false },
      });

      if (jsonData.settings && Array.isArray(jsonData.settings) && jsonData.settings.length > 0) {
        const settingsData = jsonData.settings[0];
        await tx.appSettings.upsert({
          where: { householdId },
          create: {
            householdId,
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
              householdId,
              createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            })),
            skipDuplicates: true,
          });
        }
      }

      if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
        for (const txData of jsonData.transactions) {
          let categoryId = txData.categoryId;
          
          if (txData.category && txData.category.id) {
            categoryId = txData.category.id;
          } else if (txData.category && txData.category.name) {
            const category = await tx.category.findFirst({
              where: { name: txData.category.name },
            });
            if (category) {
              categoryId = category.id;
            }
          }

          if (categoryId) {
            await tx.transaction.create({
              data: {
                id: txData.id,
                householdId,
                amount: txData.amount,
                type: txData.type,
                categoryId,
                date: new Date(txData.date),
                weekNumber: txData.weekNumber || null,
                isFixed: txData.isFixed || false,
                notes: txData.notes || null,
                tags: txData.tags || [],
                isRecurring: txData.isRecurring || false,
                createdAt: txData.createdAt ? new Date(txData.createdAt) : new Date(),
                updatedAt: txData.updatedAt ? new Date(txData.updatedAt) : new Date(),
              },
            });
          }
        }
      }

      if (jsonData.budgetItems && Array.isArray(jsonData.budgetItems)) {
        for (const biData of jsonData.budgetItems) {
          let categoryId = biData.categoryId;
          
          if (biData.category && biData.category.id) {
            categoryId = biData.category.id;
          } else if (biData.category && biData.category.name) {
            const category = await tx.category.findFirst({
              where: { name: biData.category.name },
            });
            if (category) {
              categoryId = category.id;
            }
          }

          if (categoryId) {
            await tx.budgetItem.create({
              data: {
                id: biData.id,
                householdId,
                categoryId,
                month: biData.month,
                year: biData.year,
                plannedAmount: biData.plannedAmount,
                createdAt: biData.createdAt ? new Date(biData.createdAt) : new Date(),
                updatedAt: biData.updatedAt ? new Date(biData.updatedAt) : new Date(),
              },
            });
          }
        }
      }

      if (jsonData.savingsGoals && Array.isArray(jsonData.savingsGoals)) {
        await tx.savingsGoal.createMany({
          data: jsonData.savingsGoals.map((sg: any) => ({
            id: sg.id,
            householdId,
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

      if (jsonData.loans && Array.isArray(jsonData.loans)) {
        await tx.loan.createMany({
          data: jsonData.loans.map((l: any) => ({
            id: l.id,
            householdId,
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
    const householdId = await getHouseholdId();
    await prisma.$transaction(async (tx) => {
      await tx.loanPayment.deleteMany({ where: { loan: { householdId } } });
      await tx.loan.deleteMany({ where: { householdId } });
      await tx.savingsDeposit.deleteMany({ where: { goal: { householdId } } });
      await tx.savingsGoal.deleteMany({ where: { householdId } });
      await tx.budgetItem.deleteMany({ where: { householdId } });
      await tx.transaction.deleteMany({ where: { householdId } });
      
      await tx.category.deleteMany({
        where: { householdId, isDefault: false },
      });

      await tx.appSettings.upsert({
        where: { householdId },
        create: {
          householdId,
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

/**
 * טעינה מאוחדת של כל נתוני דף ההגדרות — קריאה אחת במקום 2.
 */
export async function getSettingsPageData() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getAllCategoriesForManagement(),
  ]);
  return { settings, categories };
}

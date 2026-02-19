"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getHouseholdId } from "@/lib/auth";

/**
 * קבלת כל מטרות החיסכון
 */
export async function getSavingsGoals() {
  try {
    const householdId = await getHouseholdId();
    const goals = await prisma.savingsGoal.findMany({
      where: { householdId },
      include: {
        deposits: {
          orderBy: {
            date: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return goals;
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    throw new Error("שגיאה בטעינת מטרות חיסכון");
  }
}

/**
 * יצירת מטרת חיסכון חדשה
 */
export async function createSavingsGoal(data: {
  name: string;
  targetAmount: number;
  targetDate?: Date | null;
  icon?: string;
  color?: string;
  monthlyTarget?: number;
}) {
  try {
    const householdId = await getHouseholdId();
    const goal = await prisma.savingsGoal.create({
      data: {
        householdId,
        name: data.name,
        targetAmount: new Prisma.Decimal(data.targetAmount),
        targetDate: data.targetDate || null,
        icon: data.icon || "Target",
        color: data.color || "#0073EA",
        monthlyTarget: data.monthlyTarget
          ? new Prisma.Decimal(data.monthlyTarget)
          : null,
        currentAmount: new Prisma.Decimal(0),
        isCompleted: false,
      },
    });

    revalidatePath("/savings");
    return goal;
  } catch (error) {
    console.error("Error creating savings goal:", error);
    throw new Error("שגיאה ביצירת מטרת חיסכון");
  }
}

/**
 * עדכון מטרת חיסכון
 */
export async function updateSavingsGoal(
  id: string,
  data: {
    name?: string;
    targetAmount?: number;
    targetDate?: Date | null;
    icon?: string;
    color?: string;
    monthlyTarget?: number;
    isCompleted?: boolean;
  }
) {
  try {
    const householdId = await getHouseholdId();
    const existing = await prisma.savingsGoal.findFirst({ where: { id, householdId } });
    if (!existing) throw new Error('מטרת חיסכון לא נמצאה');
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.targetAmount !== undefined)
      updateData.targetAmount = new Prisma.Decimal(data.targetAmount);
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.monthlyTarget !== undefined)
      updateData.monthlyTarget = data.monthlyTarget
        ? new Prisma.Decimal(data.monthlyTarget)
        : null;
    if (data.isCompleted !== undefined)
      updateData.isCompleted = data.isCompleted;

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/savings");
    return goal;
  } catch (error) {
    console.error("Error updating savings goal:", error);
    throw new Error("שגיאה בעדכון מטרת חיסכון");
  }
}

/**
 * מחיקת מטרת חיסכון
 */
export async function deleteSavingsGoal(id: string) {
  try {
    const householdId = await getHouseholdId();
    const existing = await prisma.savingsGoal.findFirst({ where: { id, householdId } });
    if (!existing) throw new Error('מטרת חיסכון לא נמצאה');
    await prisma.savingsGoal.delete({
      where: { id },
    });

    revalidatePath("/savings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    throw new Error("שגיאה במחיקת מטרת חיסכון");
  }
}

/**
 * הוספת הפקדה למטרת חיסכון — verify ownership before creating
 */
export async function addDeposit(data: {
  goalId: string;
  amount: number;
  date: Date;
  notes?: string;
}) {
  try {
    const householdId = await getHouseholdId();

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: data.goalId, householdId },
    });

    if (!goal) {
      throw new Error("מטרת חיסכון לא נמצאה");
    }

    const deposit = await prisma.savingsDeposit.create({
      data: {
        goalId: data.goalId,
        amount: new Prisma.Decimal(data.amount),
        date: data.date,
        notes: data.notes || null,
      },
    });

    const newCurrentAmount = new Prisma.Decimal(goal.currentAmount.toString()).plus(
      new Prisma.Decimal(data.amount)
    );
    
    const isCompleted = newCurrentAmount.gte(goal.targetAmount);

    await prisma.savingsGoal.update({
      where: { id: data.goalId },
      data: {
        currentAmount: newCurrentAmount,
        isCompleted,
      },
    });

    revalidatePath("/savings");
    return deposit;
  } catch (error) {
    console.error("Error adding deposit:", error);
    throw new Error("שגיאה בהוספת הפקדה");
  }
}

/**
 * קבלת היסטוריית הפקדות למטרה
 */
export async function getDepositsForGoal(goalId: string) {
  try {
    const householdId = await getHouseholdId();
    const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, householdId } });
    if (!goal) throw new Error('מטרת חיסכון לא נמצאה');
    const deposits = await prisma.savingsDeposit.findMany({
      where: {
        goalId,
      },
      orderBy: {
        date: "desc",
      },
    });

    return deposits;
  } catch (error) {
    console.error("Error fetching deposits:", error);
    throw new Error("שגיאה בטעינת הפקדות");
  }
}

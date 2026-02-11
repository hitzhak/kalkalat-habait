'use server';

import { db } from '@/lib/db';
import { LoanType, Prisma } from '@prisma/client';
import { addMonths, format } from 'date-fns';
import { revalidatePath } from 'next/cache';

// === 1. קבלת כל ההלוואות הפעילות ===
export async function getLoans() {
  try {
    const loans = await db.loan.findMany({
      where: {
        isActive: true,
      },
      include: {
        payments: {
          orderBy: {
            date: 'desc',
          },
          take: 5, // 5 תשלומים אחרונים
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: loans };
  } catch (error) {
    console.error('Error fetching loans:', error);
    return { success: false, error: 'שגיאה בטעינת ההלוואות' };
  }
}

// === 2. יצירת הלוואה חדשה ===
export async function createLoan(data: {
  name: string;
  type: LoanType;
  originalAmount: number;
  monthlyPayment: number;
  interestRate?: number;
  startDate: Date;
  endDate?: Date;
  totalPayments?: number;
  notes?: string;
}) {
  try {
    const loan = await db.loan.create({
      data: {
        name: data.name,
        type: data.type,
        originalAmount: new Prisma.Decimal(data.originalAmount),
        remainingAmount: new Prisma.Decimal(data.originalAmount), // בהתחלה היתרה = הסכום המקורי
        monthlyPayment: new Prisma.Decimal(data.monthlyPayment),
        interestRate: data.interestRate ? new Prisma.Decimal(data.interestRate) : null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        totalPayments: data.totalPayments || null,
        remainingPayments: data.totalPayments || null, // בהתחלה התשלומים שנותרו = סה"כ תשלומים
        notes: data.notes || null,
        isActive: true,
      },
    });

    revalidatePath('/loans');
    return { success: true, data: loan };
  } catch (error) {
    console.error('Error creating loan:', error);
    return { success: false, error: 'שגיאה ביצירת ההלוואה' };
  }
}

// === 3. עדכון הלוואה ===
export async function updateLoan(
  id: string,
  data: {
    name?: string;
    type?: LoanType;
    monthlyPayment?: number;
    interestRate?: number;
    endDate?: Date;
    totalPayments?: number;
    notes?: string;
    isActive?: boolean;
  }
) {
  try {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.monthlyPayment !== undefined) updateData.monthlyPayment = new Prisma.Decimal(data.monthlyPayment);
    if (data.interestRate !== undefined)
      updateData.interestRate = data.interestRate ? new Prisma.Decimal(data.interestRate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.totalPayments !== undefined) updateData.totalPayments = data.totalPayments;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const loan = await db.loan.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/loans');
    return { success: true, data: loan };
  } catch (error) {
    console.error('Error updating loan:', error);
    return { success: false, error: 'שגיאה בעדכון ההלוואה' };
  }
}

// === 4. מחיקת הלוואה ===
export async function deleteLoan(id: string) {
  try {
    await db.loan.delete({
      where: { id },
    });

    revalidatePath('/loans');
    return { success: true };
  } catch (error) {
    console.error('Error deleting loan:', error);
    return { success: false, error: 'שגיאה במחיקת ההלוואה' };
  }
}

// === 5. רישום תשלום להלוואה ===
export async function addLoanPayment(
  loanId: string,
  amount: number,
  date: Date,
  principalAmount?: number,
  interestAmount?: number,
  notes?: string
) {
  try {
    // קבלת ההלוואה הנוכחית
    const loan = await db.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      return { success: false, error: 'הלוואה לא נמצאה' };
    }

    // יצירת התשלום
    const payment = await db.loanPayment.create({
      data: {
        loanId,
        amount: new Prisma.Decimal(amount),
        principalAmount: principalAmount ? new Prisma.Decimal(principalAmount) : null,
        interestAmount: interestAmount ? new Prisma.Decimal(interestAmount) : null,
        date,
        notes: notes || null,
      },
    });

    // עדכון היתרה והתשלומים שנותרו
    const newRemainingAmount = new Prisma.Decimal(loan.remainingAmount.toString()).minus(
      principalAmount || amount
    );
    const newRemainingPayments = loan.remainingPayments ? loan.remainingPayments - 1 : null;

    await db.loan.update({
      where: { id: loanId },
      data: {
        remainingAmount: newRemainingAmount.isNegative() ? new Prisma.Decimal(0) : newRemainingAmount,
        remainingPayments: newRemainingPayments && newRemainingPayments > 0 ? newRemainingPayments : 0,
      },
    });

    revalidatePath('/loans');
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error adding loan payment:', error);
    return { success: false, error: 'שגיאה ברישום התשלום' };
  }
}

// === 6. קבלת היסטוריית תשלומים להלוואה ===
export async function getLoanPayments(loanId: string) {
  try {
    const payments = await db.loanPayment.findMany({
      where: {
        loanId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return { success: true, data: payments };
  } catch (error) {
    console.error('Error fetching loan payments:', error);
    return { success: false, error: 'שגיאה בטעינת התשלומים' };
  }
}

// === 7. סיכום הלוואות ===
export async function getLoansSummary() {
  try {
    const loans = await db.loan.findMany({
      where: {
        isActive: true,
      },
    });

    // סה"כ חובות
    const totalDebt = loans.reduce((sum, loan) => {
      return sum + Number(loan.remainingAmount);
    }, 0);

    // תשלום חודשי כולל
    const totalMonthlyPayment = loans.reduce((sum, loan) => {
      return sum + Number(loan.monthlyPayment);
    }, 0);

    // חישוב צפי סיום (ההלוואה עם התשלומים הרבים ביותר שנותרו)
    let latestEndDate: Date | null = null;
    loans.forEach((loan) => {
      if (loan.remainingPayments && loan.remainingPayments > 0) {
        const estimatedEnd = addMonths(new Date(), loan.remainingPayments);
        if (!latestEndDate || estimatedEnd > latestEndDate) {
          latestEndDate = estimatedEnd;
        }
      } else if (loan.endDate) {
        if (!latestEndDate || loan.endDate > latestEndDate) {
          latestEndDate = loan.endDate;
        }
      }
    });

    return {
      success: true,
      data: {
        totalDebt,
        totalMonthlyPayment,
        estimatedEndDate: latestEndDate ? format(latestEndDate, 'yyyy-MM-dd') : null,
        loansCount: loans.length,
      },
    };
  } catch (error) {
    console.error('Error fetching loans summary:', error);
    return { success: false, error: 'שגיאה בטעינת הסיכום' };
  }
}

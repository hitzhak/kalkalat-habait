import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { ImportRowStatus, TransactionType } from '@/types';

interface ParsedTransaction {
  date: string;
  sourceDescription: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
}

interface DedupResult {
  status: ImportRowStatus;
  duplicateOfId?: string;
  duplicateReason?: string;
}

function decimalToNumber(decimal: Prisma.Decimal): number {
  return parseFloat(decimal.toString());
}

function daysDiff(d1: Date, d2: Date): number {
  return Math.abs(Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function checkDuplicates(
  householdId: string,
  sourceLabel: string,
  transactions: ParsedTransaction[]
): Promise<DedupResult[]> {
  if (transactions.length === 0) return [];

  const dates = transactions.map(t => new Date(t.date));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Extend range by 3 days for fuzzy matching
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);

  const existing = await prisma.transaction.findMany({
    where: {
      householdId,
      date: { gte: minDate, lte: maxDate },
    },
    select: {
      id: true,
      amount: true,
      type: true,
      date: true,
      source: true,
      sourceLabel: true,
      sourceDescription: true,
      categoryId: true,
      isFixed: true,
      isRecurring: true,
    },
  });

  return transactions.map(tx => {
    const txDate = new Date(tx.date);

    // Level 1: Exact duplicate (same source label)
    const exactMatch = existing.find(e =>
      e.sourceLabel === sourceLabel &&
      e.sourceDescription === tx.sourceDescription &&
      decimalToNumber(e.amount) === tx.amount &&
      e.date.toISOString().split('T')[0] === tx.date
    );
    if (exactMatch) {
      return {
        status: 'duplicate' as ImportRowStatus,
        duplicateOfId: exactMatch.id,
        duplicateReason: 'כפילות ודאית - עסקה זהה כבר קיימת',
      };
    }

    // Level 2: Suspect duplicate (manual entry, ±2 days)
    const suspectMatch = existing.find(e =>
      e.source === 'MANUAL' &&
      !e.sourceLabel &&
      decimalToNumber(e.amount) === tx.amount &&
      daysDiff(e.date, txDate) <= 2
    );
    if (suspectMatch) {
      return {
        status: 'suspect' as ImportRowStatus,
        duplicateOfId: suspectMatch.id,
        duplicateReason: 'חשד לכפילות - עסקה ידנית בסכום זהה נמצאה',
      };
    }

    // Level 3: Recurring/fixed match (same month, same amount, same category)
    if (tx.categoryId) {
      const recurringMatch = existing.find(e =>
        (e.isFixed || e.isRecurring) &&
        decimalToNumber(e.amount) === tx.amount &&
        e.type === tx.type &&
        e.categoryId === tx.categoryId &&
        e.date.getMonth() === txDate.getMonth() &&
        e.date.getFullYear() === txDate.getFullYear()
      );
      if (recurringMatch) {
        return {
          status: 'recurring_match' as ImportRowStatus,
          duplicateOfId: recurringMatch.id,
          duplicateReason: 'כבר קיים כהוצאה קבועה/חוזרת',
        };
      }
    }

    return { status: 'new' as ImportRowStatus };
  });
}

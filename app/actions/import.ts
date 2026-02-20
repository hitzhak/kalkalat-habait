'use server';

import { prisma } from '@/lib/db';
import { getHouseholdId } from '@/lib/auth';
import { TransactionType, ImportRow } from '@/types';

function getWeekNumber(date: Date): number {
  const dayOfMonth = date.getDate();
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  if (dayOfMonth <= 28) return 4;
  return 5;
}

export async function confirmImport(
  rows: ImportRow[],
  sourceLabel: string,
  fileName: string,
  fileType: string,
) {
  try {
    const householdId = await getHouseholdId();
    const selectedRows = rows.filter(r => r.isSelected && r.categoryId);

    if (selectedRows.length === 0) {
      throw new Error('לא נבחרו עסקאות לייבוא');
    }

    const batch = await prisma.importBatch.create({
      data: {
        householdId,
        fileName,
        fileType,
        sourceLabel,
        totalFound: rows.length,
        imported: selectedRows.length,
        duplicates: rows.filter(r => r.status === 'duplicate').length,
        skipped: rows.filter(r => !r.isSelected).length,
      },
    });

    // Upsert the source label for future use
    await prisma.importSourceLabel.upsert({
      where: { householdId_label: { householdId, label: sourceLabel } },
      create: { householdId, label: sourceLabel },
      update: { lastUsedAt: new Date() },
    });

    // Bulk create transactions
    const transactionData = selectedRows.map(row => {
      const date = new Date(row.date);
      const isFixed = false;
      const weekNumber = getWeekNumber(date);
      const effectiveCategoryId = row.subCategoryId || row.categoryId!;

      return {
        householdId,
        amount: row.amount,
        type: row.type as TransactionType,
        categoryId: effectiveCategoryId,
        date,
        weekNumber,
        isFixed,
        notes: row.notes || null,
        tags: [] as string[],
        isRecurring: false,
        source: 'IMPORT' as const,
        sourceLabel,
        sourceDescription: row.sourceDescription,
        importBatchId: batch.id,
      };
    });

    await prisma.transaction.createMany({ data: transactionData });

    return {
      success: true,
      batchId: batch.id,
      importedCount: selectedRows.length,
      message: `${selectedRows.length} עסקאות יובאו בהצלחה`,
    };
  } catch (error) {
    console.error('Error confirming import:', error);
    throw error instanceof Error ? error : new Error('שגיאה בייבוא העסקאות');
  }
}

export async function getSourceLabels() {
  try {
    const householdId = await getHouseholdId();
    const labels = await prisma.importSourceLabel.findMany({
      where: { householdId },
      orderBy: { lastUsedAt: 'desc' },
      select: { label: true },
    });
    return labels.map(l => l.label);
  } catch (error) {
    console.error('Error fetching source labels:', error);
    return [];
  }
}

export async function getImportHistory() {
  try {
    const householdId = await getHouseholdId();
    const batches = await prisma.importBatch.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return batches.map(b => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching import history:', error);
    return [];
  }
}

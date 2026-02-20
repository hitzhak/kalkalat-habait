import { NextRequest, NextResponse } from 'next/server';
import { getHouseholdId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { parseExcelFile, isTransferDescription, isCCPayment } from '@/lib/import-parser';
import { categorizeTransactions, UserMapping } from '@/lib/import-ai';
import { checkDuplicates } from '@/lib/import-dedup';
import { TransactionType, ImportRow, ImportPreviewData } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.pdf', '.png', '.jpg', '.jpeg'];

const CC_KEYWORDS = ['כרטיס אשראי', 'אשראי', 'כאל', 'מקס', 'ישראכרט', 'אמריקן', 'לאומי קארד', 'ויזה', 'דיינרס'];

function isCreditCardSource(label: string): boolean {
  const lower = label.toLowerCase();
  return CC_KEYWORDS.some(k => lower.includes(k));
}

function getExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const householdId = await getHouseholdId();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceLabel = formData.get('sourceLabel') as string;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 });
    }
    if (!sourceLabel) {
      return NextResponse.json({ error: 'חובה לבחור תיוג מקור' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'הקובץ גדול מדי. מקסימום 10MB' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'הקובץ ריק' }, { status: 400 });
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 });
    }

    // Load categories for AI
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        OR: [{ isDefault: true }, { householdId }],
      },
      include: {
        children: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
      },
    });

    const pastTransactions = await prisma.transaction.findMany({
      where: {
        householdId,
        source: 'IMPORT',
        sourceDescription: { not: null },
      },
      select: {
        sourceDescription: true,
        categoryId: true,
        category: { select: { id: true, name: true, parentId: true } },
      },
      distinct: ['sourceDescription'],
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const userMappings: UserMapping[] = pastTransactions
      .filter(t => t.sourceDescription)
      .map(t => ({
        description: t.sourceDescription!,
        categoryId: t.categoryId,
        parentCategoryId: t.category.parentId,
        categoryName: t.category.name,
      }));

    const buffer = Buffer.from(await file.arrayBuffer());
    let importRows: ImportRow[] = [];
    let aiError: string | undefined;

    const isCreditCard = isCreditCardSource(sourceLabel);

    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      const parsed = parseExcelFile(buffer, isCreditCard);

      if (parsed.length === 0) {
        return NextResponse.json({ error: 'לא נמצאו עסקאות בקובץ. ודא שהקובץ מכיל נתונים תקינים' }, { status: 400 });
      }

      const transactions = parsed.map(r => ({ description: r.description, type: r.type as 'INCOME' | 'EXPENSE' }));
      const aiResult = await categorizeTransactions(
        transactions,
        categories.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          children: c.children,
        })),
        userMappings
      );

      const categorizedRaw = aiResult.results;
      aiError = aiResult.aiError;

      // Build index-based lookup map (AI returns 1-based indices)
      const catMap = new Map<number, typeof categorizedRaw[number]>();
      for (const r of categorizedRaw) {
        catMap.set(r.index, r);
      }

      // Duplicate detection
      const forDedup = parsed.map((r, i) => {
        const cat = catMap.get(i + 1);
        return {
          date: r.date,
          sourceDescription: r.description,
          amount: r.amount,
          type: r.type,
          categoryId: cat?.categoryId || cat?.subCategoryId || null,
        };
      });
      const dedupResults = await checkDuplicates(householdId, sourceLabel, forDedup);

      // Build import rows
      importRows = parsed.map((row, i) => {
        const cat = catMap.get(i + 1);
        const dedup = dedupResults[i];

        const isTransfer = cat?.isTransfer || isTransferDescription(row.description) || isCCPayment(row.description);

        let status = dedup.status;
        if (isTransfer && status === 'new') {
          status = 'transfer';
        }

        const catId = cat?.subCategoryId || cat?.categoryId || null;
        let catName: string | null = null;
        let subCatName: string | null = null;

        if (cat?.categoryId) {
          const parentCat = categories.find(c => c.id === cat.categoryId);
          catName = parentCat?.name || null;
          if (cat.subCategoryId) {
            const subCat = parentCat?.children.find(s => s.id === cat.subCategoryId);
            subCatName = subCat?.name || null;
          }
        }

        return {
          index: i,
          date: row.date,
          sourceDescription: row.description,
          amount: row.amount,
          type: row.type,
          categoryId: cat?.categoryId || null,
          categoryName: catName,
          subCategoryId: cat?.subCategoryId || null,
          subCategoryName: subCatName,
          confidence: cat?.confidence || 'unknown',
          status,
          duplicateOfId: dedup.duplicateOfId,
          duplicateReason: dedup.duplicateReason,
          isSelected: status === 'new',
          notes: row.installmentInfo,
        };
      });
    } else if (ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      // PDF/Image - use AI for full extraction
      const { extractFromPDF } = await import('@/lib/import-ai');
      const base64 = buffer.toString('base64');
      const extracted = await extractFromPDF(
        base64,
        categories.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          children: c.children,
        }))
      );

      if (extracted.rows.length === 0) {
        return NextResponse.json({ error: 'לא נמצאו עסקאות בקובץ' }, { status: 400 });
      }

      // Duplicate detection
      const forDedup = extracted.rows.map(r => ({
        date: r.date,
        sourceDescription: r.description,
        amount: r.amount,
        type: r.type as TransactionType,
        categoryId: r.categoryId,
      }));
      const dedupResults = await checkDuplicates(householdId, sourceLabel, forDedup);

      importRows = extracted.rows.map((row, i) => {
        const dedup = dedupResults[i];
        const isTransfer = row.isTransfer || isTransferDescription(row.description) || isCCPayment(row.description);

        let status = dedup.status;
        if (isTransfer && status === 'new') {
          status = 'transfer';
        }

        let catName: string | null = null;
        let subCatName: string | null = null;
        if (row.categoryId) {
          const parentCat = categories.find(c => c.id === row.categoryId);
          catName = parentCat?.name || null;
          if (row.subCategoryId) {
            const subCat = parentCat?.children.find(s => s.id === row.subCategoryId);
            subCatName = subCat?.name || null;
          }
        }

        return {
          index: i,
          date: row.date,
          sourceDescription: row.description,
          amount: row.amount,
          type: row.type as TransactionType,
          categoryId: row.categoryId,
          categoryName: catName,
          subCategoryId: row.subCategoryId,
          subCategoryName: subCatName,
          confidence: row.confidence,
          status,
          duplicateOfId: dedup.duplicateOfId,
          duplicateReason: dedup.duplicateReason,
          isSelected: status === 'new',
          notes: undefined,
        };
      });
    }

    // Build summary
    const dates = importRows.map(r => r.date).filter(Boolean).sort();
    const summary: ImportPreviewData['summary'] = {
      totalFound: importRows.length,
      newCount: importRows.filter(r => r.status === 'new').length,
      duplicateCount: importRows.filter(r => r.status === 'duplicate').length,
      suspectCount: importRows.filter(r => r.status === 'suspect').length,
      transferCount: importRows.filter(r => r.status === 'transfer').length,
      recurringMatchCount: importRows.filter(r => r.status === 'recurring_match').length,
      dateRange: {
        from: dates[0] || '',
        to: dates[dates.length - 1] || '',
      },
    };

    const response: ImportPreviewData = { rows: importRows, summary };
    if (aiError) response.aiError = aiError;
    return NextResponse.json(response);
  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'שגיאה בעיבוד הקובץ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

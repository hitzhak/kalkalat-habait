import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ========== Types ==========

export interface MonthlyReportData {
  month: number;
  year: number;
  monthName: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    fixedExpenses: number;
    variableExpenses: number;
    balance: number;
    weeklyAverage: number;
  };
  expensesByCategory: Array<{
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
  expensesByWeek: Array<{
    week: number;
    weekName: string;
    amount: number;
  }>;
  transactionCount: number;
}

export interface BudgetData {
  categories: Array<{
    name: string;
    plannedAmount: number;
    actualSpent: number;
    remaining: number;
    usagePercent: number;
  }>;
  summary: {
    totalPlanned: number;
    totalActual: number;
    totalRemaining: number;
    totalUsagePercent: number;
  };
}

// ========== Helper Functions ==========

/**
 * פורמט מספר למטבע עברי
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * הורדת קובץ לדפדפן
 */
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ========== Excel Export ==========

/**
 * ייצוא דוח חודשי ל-Excel
 * כולל 3 גיליונות:
 * 1. סיכום חודשי
 * 2. הוצאות לפי קטגוריה
 * 3. הוצאות לפי שבוע
 */
export function exportMonthlyReportToExcel(
  reportData: MonthlyReportData,
  filename?: string
): void {
  // יצירת Workbook
  const wb = XLSX.utils.book_new();

  // === גיליון 1: סיכום חודשי ===
  const summaryData = [
    ['דוח חודשי - ' + reportData.monthName + ' ' + reportData.year],
    [],
    ['הכנסות', formatCurrency(reportData.summary.totalIncome)],
    ['הוצאות קבועות', formatCurrency(reportData.summary.fixedExpenses)],
    ['הוצאות משתנות', formatCurrency(reportData.summary.variableExpenses)],
    ['סה"כ הוצאות', formatCurrency(reportData.summary.totalExpenses)],
    ['מאזן', formatCurrency(reportData.summary.balance)],
    [],
    ['ממוצע שבועי (משתנות)', formatCurrency(reportData.summary.weeklyAverage)],
    ['סה"כ עסקאות', reportData.transactionCount.toString()],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);

  // עיצוב רוחב עמודות
  ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'סיכום');

  // === גיליון 2: הוצאות לפי קטגוריה ===
  const categoryHeaders = [['קטגוריה', 'סכום', 'אחוז מסך ההוצאות']];
  const categoryRows = reportData.expensesByCategory.map((cat) => [
    cat.categoryName,
    cat.amount,
    cat.percentage + '%',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([...categoryHeaders, ...categoryRows]);

  // עיצוב רוחב עמודות
  ws2['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws2, 'לפי קטגוריה');

  // === גיליון 3: הוצאות לפי שבוע ===
  const weekHeaders = [['שבוע', 'סכום']];
  const weekRows = reportData.expensesByWeek.map((week) => [week.weekName, week.amount]);

  const ws3 = XLSX.utils.aoa_to_sheet([...weekHeaders, ...weekRows]);

  // עיצוב רוחב עמודות
  ws3['!cols'] = [{ wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, ws3, 'לפי שבוע');

  // יצירת קובץ והורדה
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const defaultFilename = `דוח-חודשי-${reportData.monthName}-${reportData.year}.xlsx`;
  downloadFile(blob, filename || defaultFilename);
}

/**
 * ייצוא תקציב מול בפועל ל-Excel
 */
export function exportBudgetToExcel(budgetData: BudgetData, month: string, filename?: string): void {
  // יצירת Workbook
  const wb = XLSX.utils.book_new();

  // === גיליון 1: תקציב מול בפועל ===
  const headers = [['תקציב חודשי - ' + month], [], ['קטגוריה', 'תקציב', 'בפועל', 'נותר', 'ניצול (%)']];

  const categoryRows = budgetData.categories.map((cat) => [
    cat.name,
    cat.plannedAmount,
    cat.actualSpent,
    cat.remaining,
    cat.usagePercent.toFixed(1) + '%',
  ]);

  const summaryRows = [
    [],
    ['סה"כ', budgetData.summary.totalPlanned, budgetData.summary.totalActual, budgetData.summary.totalRemaining, budgetData.summary.totalUsagePercent.toFixed(1) + '%'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...categoryRows, ...summaryRows]);

  // עיצוב רוחב עמודות
  ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(wb, ws, 'תקציב מול בפועל');

  // יצירת קובץ והורדה
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const defaultFilename = `תקציב-${month}.xlsx`;
  downloadFile(blob, filename || defaultFilename);
}

// ========== PDF Export ==========

/**
 * ייצוא דוח חודשי ל-PDF
 * כולל: כותרת, טבלת סיכום, טבלת הוצאות לפי קטגוריה
 */
export function exportMonthlyReportToPDF(
  reportData: MonthlyReportData,
  filename?: string
): void {
  // יצירת מסמך PDF (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // כותרת
  doc.setFontSize(18);
  doc.text(`דוח חודשי — ${reportData.monthName} ${reportData.year}`, 105, 20, {
    align: 'center',
  });

  // סיכום חודשי
  doc.setFontSize(14);
  doc.text('סיכום חודשי', 105, 35, { align: 'center' });

  autoTable(doc, {
    startY: 40,
    head: [['סוג', 'סכום']],
    body: [
      ['הכנסות', formatCurrency(reportData.summary.totalIncome)],
      ['הוצאות קבועות', formatCurrency(reportData.summary.fixedExpenses)],
      ['הוצאות משתנות', formatCurrency(reportData.summary.variableExpenses)],
      ['סה"כ הוצאות', formatCurrency(reportData.summary.totalExpenses)],
      ['מאזן', formatCurrency(reportData.summary.balance)],
    ],
    styles: {
      font: 'helvetica',
      halign: 'right',
      fontSize: 11,
    },
    headStyles: {
      fillColor: [8, 145, 178], // Primary color
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 80 },
    },
    margin: { left: 25, right: 25 },
  });

  // הוצאות לפי קטגוריה
  const finalY = (doc as any).lastAutoTable.finalY || 100;

  doc.setFontSize(14);
  doc.text('הוצאות לפי קטגוריה', 105, finalY + 15, { align: 'center' });

  autoTable(doc, {
    startY: finalY + 20,
    head: [['קטגוריה', 'סכום', 'אחוז']],
    body: reportData.expensesByCategory.map((cat) => [
      cat.categoryName,
      formatCurrency(cat.amount),
      cat.percentage.toFixed(1) + '%',
    ]),
    styles: {
      font: 'helvetica',
      halign: 'right',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [8, 145, 178],
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
    },
    margin: { left: 25, right: 25 },
  });

  // פוטר
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(
      `כלכלת הבית | עמוד ${i} מתוך ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  // שמירה והורדה
  const defaultFilename = `דוח-חודשי-${reportData.monthName}-${reportData.year}.pdf`;
  doc.save(filename || defaultFilename);
}

/**
 * ייצוא תקציב מול בפועל ל-PDF
 */
export function exportBudgetToPDF(budgetData: BudgetData, month: string, filename?: string): void {
  // יצירת מסמך PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // כותרת
  doc.setFontSize(18);
  doc.text(`תקציב חודשי — ${month}`, 105, 20, { align: 'center' });

  // טבלת תקציב
  autoTable(doc, {
    startY: 30,
    head: [['קטגוריה', 'תקציב', 'בפועל', 'נותר', 'ניצול (%)']],
    body: [
      ...budgetData.categories.map((cat) => [
        cat.name,
        formatCurrency(cat.plannedAmount),
        formatCurrency(cat.actualSpent),
        formatCurrency(cat.remaining),
        cat.usagePercent.toFixed(1) + '%',
      ]),
      ['', '', '', '', ''], // שורה ריקה
      [
        'סה"כ',
        formatCurrency(budgetData.summary.totalPlanned),
        formatCurrency(budgetData.summary.totalActual),
        formatCurrency(budgetData.summary.totalRemaining),
        budgetData.summary.totalUsagePercent.toFixed(1) + '%',
      ],
    ],
    styles: {
      font: 'helvetica',
      halign: 'right',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [8, 145, 178],
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (data: any) => {
      // עיצוב שורת הסיכום
      if (data.row.index === budgetData.categories.length + 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
      }
    },
  });

  // פוטר
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`כלכלת הבית | עמוד ${i} מתוך ${pageCount}`, 105, 287, {
      align: 'center',
    });
  }

  // שמירה והורדה
  const defaultFilename = `תקציב-${month}.pdf`;
  doc.save(filename || defaultFilename);
}

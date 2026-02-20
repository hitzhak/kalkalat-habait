import * as XLSX from 'xlsx';
import { TransactionType } from '@/types';

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  installmentInfo?: string;
}

const SUMMARY_KEYWORDS = [
  'סה"כ', 'סה״כ', 'סהכ', 'יתרה', 'סכום לחיוב', 'עמלה', 'סך הכל',
  'total', 'balance', 'יתרה קודמת', 'יתרה נוכחית',
];

const TRANSFER_KEYWORDS = [
  'העברה מחשבון', 'העברה לחשבון', 'העברה בין', 'הפקדה לפיקדון',
  'פדיון פיקדון', 'העברה', 'transfer',
];

const CC_PAYMENT_KEYWORDS = [
  'חיוב כאל', 'חיוב מקס', 'חיוב ישראכרט', 'חיוב אמריקן',
  'חיוב ויזה', 'חיוב דיינרס', 'לאומי קארד', 'כרטיס אשראי',
  'חיוב כ.אשראי',
];

function isSummaryRow(text: string): boolean {
  const lower = text.trim();
  return SUMMARY_KEYWORDS.some(k => lower.includes(k));
}

export function isTransferDescription(text: string): boolean {
  const lower = text.trim();
  return TRANSFER_KEYWORDS.some(k => lower.includes(k));
}

export function isCCPayment(text: string): boolean {
  const lower = text.trim();
  return CC_PAYMENT_KEYWORDS.some(k => lower.includes(k));
}

function parseDate(val: unknown): string | null {
  if (!val) return null;

  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const month = String(d.m).padStart(2, '0');
      const day = String(d.d).padStart(2, '0');
      return `${d.y}-${month}-${day}`;
    }
    return null;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      let year = dmyMatch[3];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
    // YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

function detectColumns(headers: string[]): {
  dateCol: number;
  descCol: number;
  amountCol: number;
  debitCol: number;
  creditCol: number;
  dateCol2: number;
} {
  const result = { dateCol: -1, descCol: -1, amountCol: -1, debitCol: -1, creditCol: -1, dateCol2: -1 };
  const lowerHeaders = headers.map(h => (h || '').toString().trim().toLowerCase());

  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i];
    if (result.dateCol === -1 && (h.includes('תאריך עסקה') || h.includes('תאריך רכישה') || h === 'תאריך' || h === 'date' || h.includes('ת. עסקה'))) {
      result.dateCol = i;
    } else if (result.dateCol2 === -1 && (h.includes('תאריך חיוב') || h.includes('ת. חיוב') || h.includes('תאריך ערך'))) {
      result.dateCol2 = i;
    }

    if (result.descCol === -1 && (h.includes('תיאור') || h.includes('שם בית') || h.includes('פרטים') || h.includes('שם העסק') || h === 'description' || h.includes('פעולה'))) {
      result.descCol = i;
    }

    if (h.includes('סכום') && !h.includes('מקור') || h === 'amount' || h.includes('סכום עסקה')) {
      if (result.amountCol === -1) result.amountCol = i;
    }

    if (h.includes('חובה') || h === 'debit' || h.includes('חיוב')) {
      result.debitCol = i;
    }
    if (h.includes('זכות') || h === 'credit' || h.includes('זיכוי')) {
      result.creditCol = i;
    }
  }

  // Fallback: if no date column found, try first column
  if (result.dateCol === -1 && result.dateCol2 !== -1) {
    result.dateCol = result.dateCol2;
    result.dateCol2 = -1;
  }

  return result;
}

function parseInstallmentInfo(desc: string): string | undefined {
  const match = desc.match(/תשלום\s*(\d+)\s*מתוך\s*(\d+)/);
  if (match) return `תשלום ${match[1]}/${match[2]}`;

  const match2 = desc.match(/(\d+)\s*\/\s*(\d+)\s*תש/);
  if (match2) return `תשלום ${match2[1]}/${match2[2]}`;

  const match3 = desc.match(/(\d+)\s+מתוך\s+(\d+)/);
  if (match3) return `תשלום ${match3[1]}/${match3[2]}`;

  return undefined;
}

export function parseExcelFile(buffer: Buffer, isCreditCard = false): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rawData.length < 2) return [];

  // Find header row (first row with at least 3 non-empty cells)
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    const nonEmpty = row.filter(c => c !== '' && c != null).length;
    if (nonEmpty >= 3) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) return [];

  const headers = rawData[headerRowIdx].map(h => String(h || ''));
  const cols = detectColumns(headers);

  // Require at minimum a description column
  if (cols.descCol === -1) return [];

  const rows: ParsedRow[] = [];

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every(c => c === '' || c == null)) continue;

    const desc = String(row[cols.descCol] || '').trim();
    if (!desc || isSummaryRow(desc)) continue;

    // Parse date: prefer transaction date over billing date
    let dateStr = parseDate(row[cols.dateCol]);
    if (!dateStr && cols.dateCol2 !== -1) {
      dateStr = parseDate(row[cols.dateCol2]);
    }
    if (!dateStr) continue;

    // Parse amount
    let amount = 0;
    let type: TransactionType = TransactionType.EXPENSE;

    if (cols.debitCol !== -1 && cols.creditCol !== -1) {
      const debit = parseFloat(String(row[cols.debitCol] || '0').replace(/[,₪\s]/g, '')) || 0;
      const credit = parseFloat(String(row[cols.creditCol] || '0').replace(/[,₪\s]/g, '')) || 0;
      if (credit > 0) {
        amount = credit;
        type = TransactionType.INCOME;
      } else {
        amount = Math.abs(debit);
        type = TransactionType.EXPENSE;
      }
    } else if (cols.amountCol !== -1) {
      const rawAmount = parseFloat(String(row[cols.amountCol] || '0').replace(/[,₪\s]/g, ''));
      if (isNaN(rawAmount)) continue;
      amount = Math.abs(rawAmount);
      if (isCreditCard) {
        // CC: positive = charge (expense), negative = refund (income)
        type = rawAmount < 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
      } else {
        // Bank: positive = deposit (income), negative = withdrawal (expense)
        type = rawAmount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
      }
    } else {
      continue;
    }

    if (amount === 0) continue;

    const installmentInfo = parseInstallmentInfo(desc);
    const notes = installmentInfo ? installmentInfo : undefined;

    rows.push({ date: dateStr, description: desc, amount, type, installmentInfo: notes });
  }

  return rows;
}

export function parseCSVFile(buffer: Buffer, isCreditCard = false): ParsedRow[] {
  return parseExcelFile(buffer, isCreditCard);
}

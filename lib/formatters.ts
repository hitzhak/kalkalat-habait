/**
 * פורמט מספר למטבע עברי (שקלים)
 * @param amount - הסכום לפורמט
 * @returns מחרוזת מעוצבת, לדוגמה: ₪1,234 או -₪1,234
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  const sign = amount < 0 ? '-' : '';
  return `\u2066${sign}₪${formatted}\u2069`;
}

/**
 * פורמט תאריך עברי
 * @param date - תאריך
 * @returns מחרוזת בפורמט עברי, לדוגמה: "7 בפברואר 2026"
 */
export function formatDate(date: Date): string {
  const day = date.getDate();
  const monthName = getMonthName(date.getMonth() + 1);
  const year = date.getFullYear();
  
  return `${day} ב${monthName} ${year}`;
}

/**
 * פורמט תאריך קצר (יום/חודש/שנה)
 * @param date - תאריך
 * @returns מחרוזת בפורמט DD/MM/YYYY
 */
export function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * פורמט אחוז
 * @param value - הערך (0-100)
 * @returns מחרוזת בפורמט אחוזים, לדוגמה: "85%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * חישוב מספר שבוע בחודש לפי תאריך
 * @param date - תאריך
 * @returns מספר שבוע (1-5)
 */
export function getWeekNumber(date: Date): number {
  const dayOfMonth = date.getDate();
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  if (dayOfMonth <= 28) return 4;
  return 5;
}

/**
 * קבלת שם חודש בעברית
 * @param month - מספר חודש (1-12)
 * @returns שם החודש בעברית
 */
export function getMonthName(month: number): string {
  const monthNames = [
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
    'דצמבר'
  ];
  
  return monthNames[month - 1] || '';
}

/**
 * קבלת שם יום בשבוע בעברית
 * @param dayIndex - אינדקס יום (0=ראשון, 6=שבת)
 * @returns שם היום בעברית
 */
export function getDayName(dayIndex: number): string {
  const dayNames = [
    'ראשון',
    'שני',
    'שלישי',
    'רביעי',
    'חמישי',
    'שישי',
    'שבת'
  ];
  
  return dayNames[dayIndex] || '';
}

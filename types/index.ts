// =========== Enums ===========

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionSource {
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  RECURRING = 'RECURRING'
}

export enum LoanType {
  MORTGAGE = 'MORTGAGE',      // משכנתא
  BANK = 'BANK',              // הלוואת בנק
  EXTERNAL = 'EXTERNAL',      // חוץ בנקאי
  CREDIT = 'CREDIT',          // כרטיס אשראי
  OTHER = 'OTHER'             // אחר
}

export type AlertLevel = 'info' | 'warning' | 'error';

// =========== Interfaces ===========

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
  isFixed: boolean;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  category?: Category;
  date: Date;
  weekNumber?: number | null;
  isFixed: boolean;
  notes?: string | null;
  tags: string[];
  isRecurring: boolean;
  source: TransactionSource;
  sourceLabel?: string | null;
  sourceDescription?: string | null;
  importBatchId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  category?: Category;
  month: number;
  year: number;
  plannedAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon?: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date | null;
  monthlyTarget?: number | null;
  color?: string | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deposits?: SavingsDeposit[];
}

export interface SavingsDeposit {
  id: string;
  goalId: string;
  goal?: SavingsGoal;
  amount: number;
  date: Date;
  notes?: string | null;
  createdAt: Date;
}

export interface Loan {
  id: string;
  name: string;
  type: LoanType;
  originalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate?: number | null;
  startDate: Date;
  endDate?: Date | null;
  totalPayments?: number | null;
  remainingPayments?: number | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  payments?: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  loanId: string;
  loan?: Loan;
  amount: number;
  principalAmount?: number | null;
  interestAmount?: number | null;
  date: Date;
  notes?: string | null;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  payday: number;
  currency: string;
  startMonth: number;
  weekStartDay: number;
  createdAt: Date;
  updatedAt: Date;
}

// =========== Import Feature ===========

export type ImportFileType = 'excel' | 'pdf' | 'screenshot';

export type ImportRowStatus = 'new' | 'duplicate' | 'suspect' | 'transfer' | 'recurring_match';

export type ConfidenceLevel = 'high' | 'low' | 'unknown';

export interface ImportRow {
  index: number;
  date: string;
  sourceDescription: string;
  amount: number;
  type: TransactionType;
  categoryId: string | null;
  categoryName: string | null;
  subCategoryId: string | null;
  subCategoryName: string | null;
  confidence: ConfidenceLevel;
  status: ImportRowStatus;
  duplicateOfId?: string;
  duplicateReason?: string;
  isSelected: boolean;
  notes?: string;
  installmentInfo?: string;
}

export interface ImportPreviewData {
  rows: ImportRow[];
  summary: {
    totalFound: number;
    newCount: number;
    duplicateCount: number;
    suspectCount: number;
    transferCount: number;
    recurringMatchCount: number;
    dateRange: { from: string; to: string };
  };
  aiError?: string;
}

export interface ImportBatchInfo {
  id: string;
  fileName: string;
  fileType: string;
  sourceLabel: string;
  sourceBank?: string | null;
  totalFound: number;
  imported: number;
  duplicates: number;
  skipped: number;
  createdAt: string;
}

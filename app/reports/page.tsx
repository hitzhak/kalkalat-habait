'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { getMonthlyReport, getComparisonData, getTrendData, getReportsPageData } from '@/app/actions/reports';
import { getBudgetFlowSummary } from '@/app/actions/dashboard';
import { getBudgetForMonth } from '@/app/actions/budgets';
import { getSavingsGoals } from '@/app/actions/savings';
import { getLoans, getLoansSummary } from '@/app/actions/loans';
import type { MonthlyReportData, BudgetData } from '@/lib/export';
import { Download, FileSpreadsheet, FileText, TrendingUp, BarChart3, Loader2, Wallet, Target, Landmark, ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LineChart, Line } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// צבעים לגרפים
const COLORS = [
  '#0073EA',
  '#00C875',
  '#FDAB3D',
  '#E2445C',
  '#A25DDC',
  '#FF158A',
  '#579BFC',
  '#CAB641',
];

// שמות חודשים בעברית
const HEBREW_MONTHS = [
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
  'דצמבר',
];

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';
  return `\u2066${sign}₪${formatted}\u2069`;
}

interface ComparisonData {
  summary: {
    month1: { monthName: string; totalIncome: number; totalExpenses: number; balance: number };
    month2: { monthName: string; totalIncome: number; totalExpenses: number; balance: number };
    changes: {
      incomeChange: number;
      expensesChange: number;
      balanceChange: number;
      incomeChangePercent: number;
      expensesChangePercent: number;
    };
  };
  categoryComparison: Array<{
    categoryName: string;
    month1Amount: number;
    month2Amount: number;
    changeAmount: number;
    changePercent: number;
    changeDirection: 'increase' | 'decrease' | 'same';
  }>;
}

interface TrendData {
  data: Array<{
    monthYear: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  statistics: {
    avgIncome: number;
    avgExpenses: number;
    highestIncome: number;
    highestExpenses: number;
  };
}

export default function ReportsPage() {
  const { selectedMonth: currentMonth, selectedYear: currentYear } = useMonthNavigation();

  // State for Monthly Report
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(true);

  // State for Comparison
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [month1, setMonth1] = useState(currentMonth);
  const [year1, setYear1] = useState(currentYear);
  const [month2, setMonth2] = useState(currentMonth === 1 ? 12 : currentMonth - 1);
  const [year2, setYear2] = useState(currentMonth === 1 ? currentYear - 1 : currentYear);

  // State for Trend
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendMonths, setTrendMonths] = useState(12);

  // State for Budget Flow (moved from dashboard)
  const [budgetFlow, setBudgetFlow] = useState<any>(null);
  const [budgetCategories, setBudgetCategories] = useState<any[]>([]);

  // State for Savings & Loans
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loansSummary, setLoansSummary] = useState<any>(null);

  useEffect(() => {
    loadAllData();
    loadExtraData();
  }, [currentMonth, currentYear]);

  const loadExtraData = async () => {
    try {
      const [flow, budget, goals, loansResult, loanSum] = await Promise.all([
        getBudgetFlowSummary(currentMonth, currentYear),
        getBudgetForMonth(currentMonth, currentYear),
        getSavingsGoals(),
        getLoans(),
        getLoansSummary(),
      ]);
      setBudgetFlow(flow);
      setBudgetCategories(budget);
      setSavingsGoals(goals);
      if (loansResult.success && 'data' in loansResult) {
        setLoans(loansResult.data);
      }
      if (loanSum.success && 'data' in loanSum) {
        setLoansSummary(loanSum.data);
      }
    } catch {
      // non-critical, ignore
    }
  };

  const loadAllData = async () => {
    try {
      setLoadingMonthly(true);
      setLoadingComparison(true);
      setLoadingTrend(true);

      const data = await getReportsPageData(
        currentMonth, currentYear,
        month1, year1, month2, year2,
        trendMonths
      );

      setMonthlyReport(data.monthlyReport);
      setComparisonData(data.comparisonData);
      setTrendData(data.trendData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בטעינת הדוחות';
      toast.error(errorMessage);
    } finally {
      setLoadingMonthly(false);
      setLoadingComparison(false);
      setLoadingTrend(false);
    }
  };

  // טעינת השוואה מחדש (כשמשנים חודשים ידנית)
  const loadComparison = async () => {
    try {
      setLoadingComparison(true);
      const data = await getComparisonData(month1, year1, month2, year2);
      setComparisonData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בטעינת השוואת חודשים';
      toast.error(errorMessage);
    } finally {
      setLoadingComparison(false);
    }
  };

  // טעינת מגמות מחדש (כשמשנים טווח ידנית)
  const loadTrend = async () => {
    try {
      setLoadingTrend(true);
      const data = await getTrendData(trendMonths);
      setTrendData(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בטעינת נתוני מגמה';
      toast.error(errorMessage);
    } finally {
      setLoadingTrend(false);
    }
  };

  // ייצוא Excel - דוח חודשי (dynamic import כדי לא לטעון xlsx+jspdf בכניסה לדף)
  const handleExportMonthlyExcel = async () => {
    if (!monthlyReport) {
      toast.error('אין נתונים לייצוא');
      return;
    }
    try {
      const { exportMonthlyReportToExcel } = await import('@/lib/export');
      exportMonthlyReportToExcel(monthlyReport);
      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה בייצוא לExcel');
    }
  };

  // ייצוא PDF - דוח חודשי (dynamic import)
  const handleExportMonthlyPDF = async () => {
    if (!monthlyReport) {
      toast.error('אין נתונים לייצוא');
      return;
    }
    try {
      const { exportMonthlyReportToPDF } = await import('@/lib/export');
      exportMonthlyReportToPDF(monthlyReport);
      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה בייצוא לPDF');
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* כותרת ראשית */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">דוחות וניתוחים</h1>
        <p className="text-muted-foreground mt-1">
          דוחות חודשיים, השוואות ומגמות לאורך זמן
        </p>
      </div>

      {/* Tabs ראשי */}
      <Tabs defaultValue="monthly" className="space-y-4 md:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-5">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm px-3 sm:px-4">
              <span className="hidden sm:inline">דוח חודשי</span>
              <span className="sm:hidden">חודשי</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs sm:text-sm px-3 sm:px-4">
              תקציב
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-xs sm:text-sm px-3 sm:px-4">
              השוואה
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs sm:text-sm px-3 sm:px-4">
              מגמות
            </TabsTrigger>
            <TabsTrigger value="more" className="text-xs sm:text-sm px-3 sm:px-4">
              <span className="hidden sm:inline">חיסכון/הלוואות</span>
              <span className="sm:hidden">עוד</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: דוח חודשי */}
        <TabsContent value="monthly" className="space-y-6">
          {loadingMonthly ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : monthlyReport ? (
            <>
              {/* כפתורי ייצוא */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    דוח חודשי — {monthlyReport.monthName} {monthlyReport.year}
                  </CardTitle>
                  <CardDescription>
                    סיכום מפורט של הכנסות והוצאות החודש
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button onClick={handleExportMonthlyExcel} variant="outline">
                    <FileSpreadsheet className="ml-2 h-4 w-4" />
                    ייצוא ל-Excel
                  </Button>
                  <Button onClick={handleExportMonthlyPDF} variant="outline">
                    <FileText className="ml-2 h-4 w-4" />
                    ייצוא ל-PDF
                  </Button>
                </CardContent>
              </Card>

              {/* סיכום טקסטואלי */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הכנסות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-income-500">
                      {formatCurrency(monthlyReport.summary.totalIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      הוצאות קבועות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-warning-600">
                      {formatCurrency(monthlyReport.summary.fixedExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      הוצאות משתנות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-expense-500">
                      {formatCurrency(monthlyReport.summary.variableExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      מאזן
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-lg sm:text-2xl font-bold ${
                        monthlyReport.summary.balance >= 0 ? 'text-income-500' : 'text-expense-500'
                      }`}
                    >
                      {formatCurrency(monthlyReport.summary.balance)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* גרפים */}
              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                {/* גרף עוגה - הוצאות לפי קטגוריה */}
                <Card>
                  <CardHeader>
                    <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {monthlyReport.expensesByCategory.length > 0 &&
                     monthlyReport.expensesByCategory.some((c) => c.amount > 0) ? (
                      <div className="w-full overflow-x-auto -mx-2 px-2">
                        <div className="min-w-[300px]">
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                data={monthlyReport.expensesByCategory.slice(0, 8)}
                                dataKey="amount"
                                nameKey="categoryName"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                              >
                                {monthlyReport.expensesByCategory.slice(0, 8).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          אין נתוני הוצאות להצגה בחודש זה
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* גרף עמודות - הוצאות שבועיות */}
                <Card>
                  <CardHeader>
                    <CardTitle>הוצאות שבועיות (משתנות)</CardTitle>
                    <CardDescription>
                      ממוצע שבועי: {formatCurrency(monthlyReport.summary.weeklyAverage)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyReport.expensesByWeek.length > 0 &&
                     monthlyReport.expensesByWeek.some((w) => w.amount > 0) ? (
                      <div className="w-full overflow-x-auto -mx-2 px-2">
                        <div className="min-w-[300px]">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={monthlyReport.expensesByWeek}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="weekName" />
                              <YAxis />
                              <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                              <Bar dataKey="amount" fill="#0073EA" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          אין נתוני הוצאות שבועיות להצגה בחודש זה
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* טבלת קטגוריות */}
              <Card>
                <CardHeader>
                  <CardTitle>פירוט הוצאות לפי קטגוריה</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 font-medium">קטגוריה</th>
                          <th className="text-right py-3 px-4 font-medium">סכום</th>
                          <th className="text-right py-3 px-4 font-medium">אחוז</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyReport.expensesByCategory.map((cat, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{cat.categoryName}</td>
                            <td className="py-3 px-4">{formatCurrency(cat.amount)}</td>
                            <td className="py-3 px-4">{cat.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="animate-in fade-in duration-300">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    אין מספיק נתונים להצגת דוח
                  </h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    התחל בהוספת עסקאות כדי לראות דוחות מפורטים ומגמות
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: השוואת חודשים */}
        <TabsContent value="comparison" className="space-y-6">
          {/* בחירת חודשים */}
          <Card>
            <CardHeader>
              <CardTitle>בחירת חודשים להשוואה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* חודש 1 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">חודש 1</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={month1.toString()}
                      onValueChange={(val) => setMonth1(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HEBREW_MONTHS.map((name, idx) => (
                          <SelectItem key={idx} value={(idx + 1).toString()}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={year1.toString()}
                      onValueChange={(val) => setYear1(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* חודש 2 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">חודש 2</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={month2.toString()}
                      onValueChange={(val) => setMonth2(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HEBREW_MONTHS.map((name, idx) => (
                          <SelectItem key={idx} value={(idx + 1).toString()}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={year2.toString()}
                      onValueChange={(val) => setYear2(parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={loadComparison} disabled={loadingComparison}>
                {loadingComparison && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                השווה
              </Button>
            </CardContent>
          </Card>

          {loadingComparison ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : comparisonData ? (
            <>
              {/* סיכום השוואתי */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הכנסות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{comparisonData.summary.month1.monthName}:</span>
                      <span className="font-medium">
                        {formatCurrency(comparisonData.summary.month1.totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{comparisonData.summary.month2.monthName}:</span>
                      <span className="font-medium">
                        {formatCurrency(comparisonData.summary.month2.totalIncome)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">שינוי:</span>
                        <span
                          className={`font-bold ${
                            comparisonData.summary.changes.incomeChange >= 0
                              ? 'text-income-500'
                              : 'text-expense-500'
                          }`}
                        >
                          {comparisonData.summary.changes.incomeChange >= 0 ? '+' : ''}
                          {formatCurrency(comparisonData.summary.changes.incomeChange)} (
                          {comparisonData.summary.changes.incomeChangePercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הוצאות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{comparisonData.summary.month1.monthName}:</span>
                      <span className="font-medium">
                        {formatCurrency(comparisonData.summary.month1.totalExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{comparisonData.summary.month2.monthName}:</span>
                      <span className="font-medium">
                        {formatCurrency(comparisonData.summary.month2.totalExpenses)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">שינוי:</span>
                        <span
                          className={`font-bold ${
                            comparisonData.summary.changes.expensesChange <= 0
                              ? 'text-income-500'
                              : 'text-expense-500'
                          }`}
                        >
                          {comparisonData.summary.changes.expensesChange >= 0 ? '+' : ''}
                          {formatCurrency(comparisonData.summary.changes.expensesChange)} (
                          {comparisonData.summary.changes.expensesChangePercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      מאזן
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{comparisonData.summary.month1.monthName}:</span>
                      <span
                        className={`font-medium ${
                          comparisonData.summary.month1.balance >= 0
                            ? 'text-income-500'
                            : 'text-expense-500'
                        }`}
                      >
                        {formatCurrency(comparisonData.summary.month1.balance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{comparisonData.summary.month2.monthName}:</span>
                      <span
                        className={`font-medium ${
                          comparisonData.summary.month2.balance >= 0
                            ? 'text-income-500'
                            : 'text-expense-500'
                        }`}
                      >
                        {formatCurrency(comparisonData.summary.month2.balance)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">שינוי:</span>
                        <span
                          className={`font-bold ${
                            comparisonData.summary.changes.balanceChange >= 0
                              ? 'text-income-500'
                              : 'text-expense-500'
                          }`}
                        >
                          {comparisonData.summary.changes.balanceChange >= 0 ? '+' : ''}
                          {formatCurrency(comparisonData.summary.changes.balanceChange)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* גרף עמודות כפולות */}
              <Card>
                <CardHeader>
                  <CardTitle>השוואת הוצאות לפי קטגוריה</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto -mx-2 px-2">
                    <div className="min-w-[320px]">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                          data={comparisonData.categoryComparison.slice(0, 10)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="categoryName" angle={-30} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                          <Legend />
                          <Bar
                            dataKey="month1Amount"
                            fill="#0073EA"
                            name={comparisonData.summary.month1.monthName}
                          />
                          <Bar
                            dataKey="month2Amount"
                            fill="#00C875"
                            name={comparisonData.summary.month2.monthName}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* טבלת השוואה */}
              <Card>
                <CardHeader>
                  <CardTitle>טבלת השוואה מפורטת</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 font-medium">קטגוריה</th>
                          <th className="text-right py-3 px-4 font-medium">
                            {comparisonData.summary.month1.monthName}
                          </th>
                          <th className="text-right py-3 px-4 font-medium">
                            {comparisonData.summary.month2.monthName}
                          </th>
                          <th className="text-right py-3 px-4 font-medium">שינוי</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonData.categoryComparison.map((cat, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{cat.categoryName}</td>
                            <td className="py-3 px-4">{formatCurrency(cat.month1Amount)}</td>
                            <td className="py-3 px-4">{formatCurrency(cat.month2Amount)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={
                                  cat.changeDirection === 'increase'
                                    ? 'text-expense-500'
                                    : cat.changeDirection === 'decrease'
                                    ? 'text-income-500'
                                    : ''
                                }
                              >
                                {cat.changeAmount >= 0 ? '+' : ''}
                                {formatCurrency(cat.changeAmount)} ({cat.changePercent.toFixed(1)}
                                %)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Tab 3: מגמות */}
        <TabsContent value="trends" className="space-y-6">
          {/* בחירת טווח */}
          <Card>
            <CardHeader>
              <CardTitle>ניתוח מגמות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <label className="text-sm font-medium shrink-0">מספר חודשים:</label>
                <div className="flex items-center gap-3">
                  <Select
                    value={trendMonths.toString()}
                    onValueChange={(val) => setTrendMonths(parseInt(val))}
                  >
                    <SelectTrigger className="w-[140px] sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 חודשים</SelectItem>
                      <SelectItem value="12">12 חודשים</SelectItem>
                      <SelectItem value="18">18 חודשים</SelectItem>
                      <SelectItem value="24">24 חודשים</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadTrend} disabled={loadingTrend}>
                    {loadingTrend && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    טען
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingTrend ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trendData ? (
            <>
              {/* סטטיסטיקות */}
              <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ממוצע הכנסות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-income-500">
                      {formatCurrency(trendData.statistics.avgIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      ממוצע הוצאות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold text-expense-500">
                      {formatCurrency(trendData.statistics.avgExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      הכנסות מקסימליות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {formatCurrency(trendData.statistics.highestIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                      הוצאות מקסימליות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg sm:text-2xl font-bold">
                      {formatCurrency(trendData.statistics.highestExpenses)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* גרף קווים */}
              <Card>
                <CardHeader>
                  <CardTitle>מגמת הכנסות והוצאות</CardTitle>
                  <CardDescription>
                    {trendMonths} חודשים אחרונים
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto -mx-2 px-2">
                    <div className="min-w-[320px]">
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                          data={trendData.data}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monthYear" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 10 }} />
                          <YAxis />
                          <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#00C875"
                            strokeWidth={2}
                            name="הכנסות"
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#E2445C"
                            strokeWidth={2}
                            name="הוצאות"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* טבלת נתונים */}
              <Card>
                <CardHeader>
                  <CardTitle>נתונים מפורטים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 font-medium">חודש</th>
                          <th className="text-right py-3 px-4 font-medium">הכנסות</th>
                          <th className="text-right py-3 px-4 font-medium">הוצאות</th>
                          <th className="text-right py-3 px-4 font-medium">מאזן</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendData.data.map((row, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{row.monthYear}</td>
                            <td className="py-3 px-4 text-income-500">
                              {formatCurrency(row.income)}
                            </td>
                            <td className="py-3 px-4 text-expense-500">
                              {formatCurrency(row.expenses)}
                            </td>
                            <td
                              className={`py-3 px-4 font-medium ${
                                row.balance >= 0 ? 'text-income-500' : 'text-expense-500'
                              }`}
                            >
                              {formatCurrency(row.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Tab: Budget Flow & Budget vs Actual */}
        <TabsContent value="budget" className="space-y-6">
          {/* Budget Flow */}
          {budgetFlow && budgetFlow.totalIncome > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary-500" />
                  זרימת תקציב חודשי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <div className="text-[10px] sm:text-xs text-emerald-600 font-medium">הכנסות</div>
                    <div className="text-sm sm:text-lg font-bold text-emerald-700">{formatCurrency(budgetFlow.totalIncome)}</div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3">
                    <div className="text-[10px] sm:text-xs text-orange-600 font-medium">קבועות</div>
                    <div className="text-sm sm:text-lg font-bold text-orange-700">-{formatCurrency(budgetFlow.fixedExpenses)}</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="text-[10px] sm:text-xs text-blue-600 font-medium">נותר למשתנות</div>
                    <div className="text-sm sm:text-lg font-bold text-blue-700">{formatCurrency(budgetFlow.availableForVariable)}</div>
                  </div>
                  <div className={`rounded-lg p-3 ${budgetFlow.netRemaining >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className={`text-[10px] sm:text-xs font-medium ${budgetFlow.netRemaining >= 0 ? 'text-income-600' : 'text-expense-500'}`}>יתרה סופית</div>
                    <div className={`text-sm sm:text-lg font-bold ${budgetFlow.netRemaining >= 0 ? 'text-income-700' : 'text-expense-600'}`}>{formatCurrency(budgetFlow.netRemaining)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget vs Actual table */}
          {budgetCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>תקציב מול בפועל</CardTitle>
                <CardDescription>השוואת הקצאת תקציב להוצאות בפועל</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-3 px-4 font-medium">קטגוריה</th>
                        <th className="text-right py-3 px-4 font-medium">תקציב</th>
                        <th className="text-right py-3 px-4 font-medium">בפועל</th>
                        <th className="text-right py-3 px-4 font-medium">נותר</th>
                        <th className="text-right py-3 px-4 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budgetCategories
                        .filter((c: any) => c.plannedAmount > 0)
                        .map((cat: any) => (
                        <tr key={cat.id} className="border-b">
                          <td className="py-3 px-4 font-medium">{cat.name}</td>
                          <td className="py-3 px-4">{formatCurrency(cat.plannedAmount)}</td>
                          <td className="py-3 px-4">{formatCurrency(cat.actualSpent)}</td>
                          <td className={`py-3 px-4 font-bold ${cat.remaining >= 0 ? 'text-income-500' : 'text-expense-500'}`}>
                            {formatCurrency(cat.remaining)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={Math.min(cat.usagePercent, 100)}
                                className="h-2 w-16"
                                indicatorClassName={cat.usagePercent >= 100 ? 'bg-expense-500' : cat.usagePercent >= 80 ? 'bg-warning-500' : 'bg-income-500'}
                              />
                              <span className="text-xs">{Math.round(cat.usagePercent)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {!budgetFlow && budgetCategories.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">אין נתוני תקציב להצגה</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Savings & Loans */}
        <TabsContent value="more" className="space-y-6">
          {/* Savings Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                מטרות חיסכון
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savingsGoals.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">אין מטרות חיסכון עדיין</p>
              ) : (
                <div className="space-y-4">
                  {savingsGoals.map((goal: any) => {
                    const pct = goal.targetAmount > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
                    return (
                      <div key={goal.id} className="space-y-2 p-3 rounded-lg bg-secondary">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(Number(goal.currentAmount))} / {formatCurrency(Number(goal.targetAmount))}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(pct, 100)}
                          className="h-2"
                          indicatorClassName={pct >= 100 ? 'bg-income-500' : 'bg-primary-500'}
                        />
                        <div className="text-xs text-muted-foreground text-left">{Math.round(pct)}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-amber-600" />
                הלוואות וחובות
              </CardTitle>
              {loansSummary && (
                <CardDescription>
                  סה&quot;כ חוב: {formatCurrency(Number(loansSummary.totalDebt || 0))} · תשלום חודשי: {formatCurrency(Number(loansSummary.totalMonthlyPayment || 0))}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {loans.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">אין הלוואות פעילות</p>
              ) : (
                <div className="space-y-3">
                  {loans.map((loan: any) => {
                    const paidPct = Number(loan.originalAmount) > 0
                      ? ((Number(loan.originalAmount) - Number(loan.remainingAmount)) / Number(loan.originalAmount)) * 100
                      : 0;
                    return (
                      <div key={loan.id} className="p-3 rounded-lg bg-secondary space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{loan.name}</span>
                          <span className="text-sm font-bold text-foreground">
                            {formatCurrency(Number(loan.remainingAmount))}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(paidPct, 100)}
                          className="h-2"
                          indicatorClassName="bg-amber-500"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>שולם {Math.round(paidPct)}%</span>
                          <span>תשלום: {formatCurrency(Number(loan.monthlyPayment))}/חודש</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

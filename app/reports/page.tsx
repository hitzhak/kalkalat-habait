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
import { getMonthlyReport, getComparisonData, getTrendData } from '@/app/actions/reports';
import {
  exportMonthlyReportToExcel,
  exportMonthlyReportToPDF,
  exportBudgetToExcel,
  exportBudgetToPDF,
  MonthlyReportData,
  BudgetData,
} from '@/lib/export';
import { Download, FileSpreadsheet, FileText, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LineChart, Line } from 'recharts';
import { toast } from 'sonner';

// צבעים לגרפים
const COLORS = [
  '#0891B2', // Cyan-600
  '#10B981', // Emerald-500
  '#F59E0B', // Amber-500
  '#EF4444', // Red-500
  '#8B5CF6', // Violet-500
  '#EC4899', // Pink-500
  '#6366F1', // Indigo-500
  '#14B8A6', // Teal-500
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

// פורמט מטבע
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReportsPage() {
  const { currentMonth, currentYear } = useMonthNavigation();

  // State for Monthly Report
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(true);

  // State for Comparison
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [month1, setMonth1] = useState(currentMonth);
  const [year1, setYear1] = useState(currentYear);
  const [month2, setMonth2] = useState(currentMonth === 1 ? 12 : currentMonth - 1);
  const [year2, setYear2] = useState(currentMonth === 1 ? currentYear - 1 : currentYear);

  // State for Trend
  const [trendData, setTrendData] = useState<any>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendMonths, setTrendMonths] = useState(12);

  // טעינת דוח חודשי
  useEffect(() => {
    loadMonthlyReport();
  }, [currentMonth, currentYear]);

  const loadMonthlyReport = async () => {
    try {
      setLoadingMonthly(true);
      const data = await getMonthlyReport(currentMonth, currentYear);
      setMonthlyReport(data);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת הדוח החודשי');
    } finally {
      setLoadingMonthly(false);
    }
  };

  // טעינת השוואה
  const loadComparison = async () => {
    try {
      setLoadingComparison(true);
      const data = await getComparisonData(month1, year1, month2, year2);
      setComparisonData(data);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת השוואת חודשים');
    } finally {
      setLoadingComparison(false);
    }
  };

  // טעינת מגמות
  const loadTrend = async () => {
    try {
      setLoadingTrend(true);
      const data = await getTrendData(trendMonths);
      setTrendData(data);
    } catch (error: any) {
      toast.error(error.message || 'שגיאה בטעינת נתוני מגמה');
    } finally {
      setLoadingTrend(false);
    }
  };

  // טעינת השוואה בהפעלה ראשונה
  useEffect(() => {
    loadComparison();
  }, []);

  // טעינת מגמות בהפעלה ראשונה
  useEffect(() => {
    loadTrend();
  }, []);

  // ייצוא Excel - דוח חודשי
  const handleExportMonthlyExcel = () => {
    if (!monthlyReport) {
      toast.error('אין נתונים לייצוא');
      return;
    }
    try {
      exportMonthlyReportToExcel(monthlyReport);
      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה בייצוא לExcel');
    }
  };

  // ייצוא PDF - דוח חודשי
  const handleExportMonthlyPDF = () => {
    if (!monthlyReport) {
      toast.error('אין נתונים לייצוא');
      return;
    }
    try {
      exportMonthlyReportToPDF(monthlyReport);
      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה בייצוא לPDF');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* כותרת ראשית */}
      <div>
        <h1 className="text-3xl font-bold">דוחות וניתוחים</h1>
        <p className="text-muted-foreground mt-1">
          דוחות חודשיים, השוואות ומגמות לאורך זמן
        </p>
      </div>

      {/* Tabs ראשי */}
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">דוח חודשי</span>
            <span className="sm:hidden">חודשי</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">השוואת חודשים</span>
            <span className="sm:hidden">השוואה</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">מגמות</span>
            <span className="sm:hidden">מגמות</span>
          </TabsTrigger>
        </TabsList>

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הכנסות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(monthlyReport.summary.totalIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הוצאות קבועות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(monthlyReport.summary.fixedExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הוצאות משתנות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
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
                      className={`text-2xl font-bold ${
                        monthlyReport.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(monthlyReport.summary.balance)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* גרפים */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* גרף עוגה - הוצאות לפי קטגוריה */}
                <Card>
                  <CardHeader>
                    <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={monthlyReport.expensesByCategory.slice(0, 8)}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) =>
                            `${entry.categoryName}: ${entry.percentage.toFixed(1)}%`
                          }
                        >
                          {monthlyReport.expensesByCategory.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyReport.expensesByWeek}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="weekName" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="amount" fill="#0891B2" />
                      </BarChart>
                    </ResponsiveContainer>
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
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                לא נמצאו נתונים לחודש זה
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
                              ? 'text-green-600'
                              : 'text-red-600'
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
                              ? 'text-green-600'
                              : 'text-red-600'
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
                            ? 'text-green-600'
                            : 'text-red-600'
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
                            ? 'text-green-600'
                            : 'text-red-600'
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
                              ? 'text-green-600'
                              : 'text-red-600'
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
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={comparisonData.categoryComparison.slice(0, 10)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoryName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar
                        dataKey="month1Amount"
                        fill="#0891B2"
                        name={comparisonData.summary.month1.monthName}
                      />
                      <Bar
                        dataKey="month2Amount"
                        fill="#10B981"
                        name={comparisonData.summary.month2.monthName}
                      />
                    </BarChart>
                  </ResponsiveContainer>
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
                        {comparisonData.categoryComparison.map((cat: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{cat.categoryName}</td>
                            <td className="py-3 px-4">{formatCurrency(cat.month1Amount)}</td>
                            <td className="py-3 px-4">{formatCurrency(cat.month2Amount)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={
                                  cat.changeDirection === 'increase'
                                    ? 'text-red-600'
                                    : cat.changeDirection === 'decrease'
                                    ? 'text-green-600'
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
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">מספר חודשים:</label>
                <Select
                  value={trendMonths.toString()}
                  onValueChange={(val) => setTrendMonths(parseInt(val))}
                >
                  <SelectTrigger className="w-[180px]">
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
            </CardContent>
          </Card>

          {loadingTrend ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trendData ? (
            <>
              {/* סטטיסטיקות */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ממוצע הכנסות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(trendData.statistics.avgIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ממוצע הוצאות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(trendData.statistics.avgExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הכנסות מקסימליות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(trendData.statistics.highestIncome)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      הוצאות מקסימליות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
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
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={trendData.data}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthYear" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="הכנסות"
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="הוצאות"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                        {trendData.data.map((row: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-3 px-4">{row.monthYear}</td>
                            <td className="py-3 px-4 text-green-600">
                              {formatCurrency(row.income)}
                            </td>
                            <td className="py-3 px-4 text-red-600">
                              {formatCurrency(row.expenses)}
                            </td>
                            <td
                              className={`py-3 px-4 font-medium ${
                                row.balance >= 0 ? 'text-green-600' : 'text-red-600'
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
      </Tabs>
    </div>
  );
}

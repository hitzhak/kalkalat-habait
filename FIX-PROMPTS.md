# 🔧 תוכנית תיקונים — כלכלת הבית
## ממצאי סקירת קוד מלאה + פרומפטים מוכנים ל-Cursor Auto

---

# סדר ביצוע

| # | סוג | תיאור | עדיפות |
|---|------|--------|--------|
| 1 | באג קריטי | הדשבורד לא מגיב לניווט חודשים | 🔴 |
| 2 | באג קריטי | imports שבורים מ-@prisma/client | 🔴 |
| 3 | באג קריטי | imports מיותרים + טיפוס חסר בדף הלוואות | 🔴 |
| 4 | UX | חסרים loading states לדפי Server Component | 🟠 |
| 5 | UX | ניווט מובייל חסר קישורים חשובים | 🟠 |
| 6 | Responsive | כפתור הוספה מהירה — מיקום שגוי בדסקטופ RTL | 🟠 |
| 7 | Responsive | דף דוחות — גרפים נשברים במובייל | 🟡 |
| 8 | Responsive | דף הלוואות — גודל טקסט ומרווחים במובייל | 🟡 |
| 9 | UX | Header כפול בדף תקציב | 🟡 |
| 10 | קוד | איחוד ייצוא db/prisma ל-pattern אחיד | 🟢 |
| 11 | קוד | תיקון טיפוסי any[] | 🟢 |
| 12 | ביצועים | הוספת loading.tsx ל-Suspense אוטומטי | 🟢 |

**כלל חשוב:** בצע פרומפט אחד → בדוק ב-`npm run dev` → `git commit` → רק אז עבור לפרומפט הבא.

---

# פרומפט 1 — באג קריטי: הדשבורד לא מגיב לניווט חודשים

## הבעיה
הדשבורד (app/page.tsx) הוא Server Component שקורא לנתונים עם `getCurrentMonthYear()` ישירות. ה-Header מציג בורר חודשים שמעדכן את ה-Zustand store, אבל הדשבורד לא קורא מהstore — הוא תמיד מציג את החודש הנוכחי.

## הפרומפט

```
📎 @app/page.tsx @stores/appStore.ts @hooks/useMonthNavigation.ts

באג: הדשבורד תמיד מציג את החודש הנוכחי ולא מגיב ללחיצה על חצי הניווט (קדימה/אחורה) ב-Header.

הסיבה: app/page.tsx הוא Server Component שקורא getCurrentMonthYear() בצד השרת. ה-Header משנה את ה-Zustand store בצד הלקוח, אבל השרת לא יודע על זה.

התיקון — הפוך את app/page.tsx ל-Client Component:

1. הוסף 'use client' בראש הקובץ

2. במקום הפונקציה getCurrentMonthYear, השתמש ב-hook:
   const { selectedMonth, selectedYear } = useAppStore();
   (הוסף import מ-@/stores/appStore)

3. עטוף את DashboardContent ב-useEffect + useState:
   - state: dashboardData (null בהתחלה), loading (true), error (null)
   - useEffect שמאזין ל-selectedMonth, selectedYear
   - בתוך ה-useEffect: קרא לכל ה-server actions (getTransactionsSummary, getPreviousMonthSummary, getTransactions, getExpensesByCategory, getWeeklyVariableExpenses, getTotalBudgetSummary, getBudgetAlerts) עם Promise.all
   - שמור תוצאות ב-state

4. הסר את "export const dynamic = 'force-dynamic'"

5. בזמן loading: הצג את DashboardSkeleton הקיים

6. אם יש error: הצג DbConnectionError

7. אם hasData = false: הצג EmptyState

8. אחרת: הצג את כל הקומפוננטות (SummaryCards, BudgetProgress, וכו') עם הנתונים מה-state

9. הסר את Suspense — אנחנו מנהלים loading בעצמנו עכשיו

שמור על כל הלוגיקה הקיימת (חישוב averageWeeklyBudget, monthNames, באנר עסקאות חוזרות).
אל תשנה שום קובץ אחר.
```

---

# פרומפט 2 — באג קריטי: imports שבורים מ-@prisma/client

## הבעיה
שני קבצים מייבאים טיפוסים מ-@prisma/client במקום מ-@/types. זה עלול לגרום לשגיאות runtime אם Prisma Client לא generated נכון ב-Vercel.

## הפרומפט

```
📎 @components/loans/LoanCard.tsx @components/savings/SavingsGoalCard.tsx @types/index.ts

בשני קבצים יש import שגוי מ-@prisma/client במקום מ-@/types.

תיקון 1 — components/loans/LoanCard.tsx:
שורה 8 בערך: שנה
  import { LoanType } from '@prisma/client';
ל:
  import { LoanType } from '@/types';

תיקון 2 — components/savings/SavingsGoalCard.tsx:
שורה 4 בערך: שנה
  import { SavingsGoal } from "@prisma/client";
ל:
  import { SavingsGoal } from "@/types";

אל תשנה שום דבר אחר בקבצים האלה — רק את שורות ה-import.
```

---

# פרומפט 3 — באג: טיפוס חסר + imports מיותרים בדף הלוואות

## הבעיה
app/loans/page.tsx משתמש ב-`(loan: Loan)` בשורה 115 אבל Loan לא מיובא. גם יש imports מיותרים שלא בשימוש.

## הפרומפט

```
📎 @app/loans/page.tsx @types/index.ts

בדף ההלוואות יש 2 בעיות:

בעיה 1: בשורה 115 יש (loan: Loan) אבל הטיפוס Loan לא מיובא.
הוסף בראש הקובץ:
  import { Loan } from '@/types';

בעיה 2: יש imports מיותרים שלא בשימוש בדף עצמו (הם בשימוש בקומפוננטות אחרות):
מחק את ה-imports הבאים מהקובץ:
  - Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
  - Input
  - Label
  - Select, SelectContent, SelectItem, SelectTrigger, SelectValue
  - Textarea

שמור רק את ה-imports שבשימוש בפועל:
  - getLoans, getLoansSummary
  - LoanCard
  - DbConnectionError
  - Button
  - Card, CardContent, CardDescription, CardHeader, CardTitle
  - Calendar, TrendingDown, Wallet, Plus
  - CreateLoanDialog
  - Loan (חדש)

אל תשנה שום דבר אחר בקובץ.
```

---

# פרומפט 4 — UX: הוספת Loading States לדפים

## הבעיה
דפי Loans ו-Savings הם Server Components שטוענים נתונים מ-DB. אין להם loading.tsx — המשתמש רואה מסך ריק עד שהנתונים מגיעים.

## הפרומפט

```
📎 @app/loans/page.tsx @app/savings/page.tsx

צור 2 קבצי loading חדשים:

קובץ 1: app/loans/loading.tsx
```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function LoansLoading() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
```

קובץ 2: app/savings/loading.tsx
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function SavingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
```

צור את שני הקבצים. אל תשנה קבצים קיימים.
```

---

# פרומפט 5 — UX: ניווט מובייל חסר קישורים

## הבעיה
ה-MobileNav מציג רק 4 קישורים (דשבורד, תקציב, חיסכון, דוחות). חסרים: הכנסות והוצאות, הלוואות. אלה דפים חשובים שהמשתמש צריך גישה אליהם מהמובייל.

## הפרומפט

```
📎 @components/layout/MobileNav.tsx

ה-MobileNav מציג רק 4 קישורים. צריך להוסיף עוד 2 קישורים חשובים.

שנה את מערך navItems ל:
const navItems = [
  { href: '/', label: 'דשבורד', icon: Home },
  { href: '/transactions', label: 'עסקאות', icon: Receipt },
  { href: '/budget', label: 'תקציב', icon: LayoutList },
  { href: '/savings', label: 'חיסכון', icon: Target },
  { href: '/loans', label: 'הלוואות', icon: Landmark },
  { href: '/reports', label: 'דוחות', icon: BarChart3 },
];

עדכן את ה-imports בהתאם:
import { Home, Receipt, LayoutList, Target, Landmark, BarChart3 } from 'lucide-react';

שנה את ה-className של ה-nav container כדי שיתאים ל-6 פריטים:
במקום "flex h-16" שנה ל "flex h-16"
(6 פריטים עדיין מתאימים ב-justify-around)

שנה את גודל הטקסט והאייקונים כדי שיתאימו ל-6 פריטים:
- Icon: שנה מ-"h-5 w-5" ל-"h-4 w-4"
- Label: שנה מ-"text-xs" ל-"text-[10px]"
- padding: שנה מ-"px-3 py-2" ל-"px-1 py-2"

אל תשנה שום דבר אחר.
```

---

# פרומפט 6 — Responsive: מיקום כפתור הוספה מהירה

## הבעיה
כפתור ה-FAB נמצא ב-`left-4` במובייל, אבל בדסקטופ עובר ל-`md:right-6 md:left-auto`. בדסקטופ RTL עם sidebar בצד ימין, `right-6` שם את הכפתור מתחת ל-sidebar.

## הפרומפט

```
📎 @components/layout/QuickAddButton.tsx

כפתור ההוספה המהירה (FAB) ממוקם לא נכון בדסקטופ.

מצב נוכחי: "fixed bottom-20 left-4 z-50 ... md:bottom-6 md:right-6 md:left-auto"

בעיה: בדסקטופ md:right-6 שם את הכפתור מתחת ל-Sidebar (שנמצא ב-right-0 ורוחבו 240px).

שנה את ה-className של ה-Button ל:
"fixed bottom-20 left-4 z-50 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:left-6 hover:scale-110 active:scale-95 transition-transform duration-200 animate-in fade-in zoom-in"

(הסרנו md:right-6 md:left-auto — הכפתור נשאר בצד שמאל תמיד, שזה ה-"end" side ב-RTL)

אל תשנה שום דבר אחר בקובץ.
```

---

# פרומפט 7 — Responsive: גרפים בדף דוחות

## הבעיה
גרפי Recharts בדף הדוחות לא מותאמים למובייל: תוויות ארוכות בעברית נחתכות, XAxis בזווית -45 עם height=100 מבזבז מקום.

## הפרומפט

```
📎 @app/reports/page.tsx

הגרפים בדף הדוחות לא מותאמים למובייל.

בצע את השינויים הבאים:

1. גרף עוגה בדוח חודשי (Tab 1) — שורה שמכילה PieChart:
   שנה outerRadius={80} ל outerRadius={70}
   הסר label מה-Pie (התוויות בעברית ארוכות מדי)
   שמור את ה-Tooltip וה-Legend

2. גרף עמודות בדוח חודשי (Tab 1) — BarChart data={monthlyReport.expensesByWeek}:
   הסר angle={-45} מה-XAxis (מיותר לשמות שבועות קצרים)
   שנה height={300} ל height={250}

3. גרף השוואה (Tab 2) — BarChart data={comparisonData.categoryComparison}:
   שנה את ה-XAxis:
     angle={-45} textAnchor="end" height={100}
   ל:
     angle={-30} textAnchor="end" height={80} interval={0} tick={{ fontSize: 10 }}

4. גרף מגמות (Tab 3) — LineChart data={trendData.data}:
   שנה את ה-XAxis:
     angle={-45} textAnchor="end" height={100}
   ל:
     angle={-30} textAnchor="end" height={70} tick={{ fontSize: 10 }}

5. עטוף כל גרף ResponsiveContainer ב-div עם overflow:
   <div className="w-full overflow-x-auto">
     <div className="min-w-[400px]">
       <ResponsiveContainer ...>

   (ככה במובייל אפשר לגלול לצדדים אם הגרף צר מדי)

אל תשנה לוגיקה עסקית או server actions. רק UI של הגרפים.
```

---

# פרומפט 8 — Responsive: דף הלוואות

## הבעיה
כרטיסי הסיכום בדף ההלוואות משתמשים ב-`text-3xl` ו-`text-2xl` בלי responsive sizing, ואין padding מספיק למובייל.

## הפרומפט

```
📎 @app/loans/page.tsx

שיפור responsive בדף ההלוואות:

1. כותרת הדף:
   שנה "text-3xl font-bold" ל "text-2xl md:text-3xl font-bold"

2. כרטיסי סיכום (3 כרטיסים):
   - סה"כ חובות: שנה "text-3xl font-bold text-red-600" ל "text-xl md:text-3xl font-bold text-red-600"
   - תשלום חודשי: שנה "text-3xl font-bold" ל "text-xl md:text-3xl font-bold"
   - צפי סיום: שנה "text-2xl font-bold" ל "text-lg md:text-2xl font-bold"

3. רשימת הלוואות:
   שנה grid מ "grid grid-cols-1 md:grid-cols-2 gap-4" ל "grid grid-cols-1 lg:grid-cols-2 gap-4"
   (ב-tablet אחד בשורה נראה יותר טוב)

4. container:
   שנה "container mx-auto p-4 md:p-6 space-y-6" ל "container mx-auto px-4 py-4 md:p-6 space-y-6 pb-24 md:pb-6"
   (pb-24 למרווח מ-MobileNav)

אל תשנה שום דבר אחר.
```

---

# פרומפט 9 — UX: Header כפול בדף תקציב

## הבעיה
בדף התקציב יש בורר חודש בתוך הדף (עם חיצים), ובנוסף ה-Header הגלובלי גם מציג בורר חודש. זה מבלבל — שני בוררים שנראים שונים אבל עושים את אותו הדבר.

## הפרומפט

```
📎 @app/budget/page.tsx

בדף התקציב יש בורר חודש משלו (עם חצים ו-monthYearDisplay) שמכפיל את ה-Header הגלובלי.

הסר את בורר החודש המקומי:

1. מחק את החלק הזה מה-JSX (בורר החודש הפנימי בדף):
   הסר את כל ה-div שמכיל:
   - Button עם ChevronRight (goToPrevMonth)
   - div עם monthYearDisplay
   - Button עם ChevronLeft (goToNextMonth)

2. השאר רק את:
   - הכותרת h1 "תקציב חודשי"
   - כפתור "העתק מחודש קודם"

3. הסר imports שלא בשימוש אחרי השינוי:
   - ChevronRight, ChevronLeft (אם לא בשימוש במקום אחר)

4. שמור את כל שאר הלוגיקה כמו שהיא (selectedMonth, selectedYear, goToPrevMonth, goToNextMonth עדיין נחוצים ל-useMonthNavigation שנשאר בשימוש בloadBudgetData)

אל תשנה שום דבר אחר בקובץ.
```

---

# פרומפט 10 — קוד: איחוד db/prisma exports

## הבעיה
lib/db.ts מייצא גם `prisma` וגם `db` (שניהם אותו אובייקט). חלק מהקבצים משתמשים ב-`prisma`, חלק ב-`db`. זה מבלבל.

## הפרומפט

```
📎 @lib/db.ts @app/actions/loans.ts @app/actions/savings.ts

בlib/db.ts מיוצא גם prisma וגם db. חלק מהקבצים משתמשים ב-prisma וחלק ב-db. זה מבלבל.

תיקון — החלף את כל השימושים ב-db ל-prisma:

1. app/actions/loans.ts:
   שנה: import { db } from '@/lib/db';
   ל: import { prisma } from '@/lib/db';
   
   החלף כל db. ב-prisma. בקובץ (db.loan → prisma.loan, db.loanPayment → prisma.loanPayment)

2. app/actions/savings.ts:
   שנה: import { db } from "@/lib/db";
   ל: import { prisma } from "@/lib/db";
   
   החלף כל db. ב-prisma. בקובץ (db.savingsGoal → prisma.savingsGoal, db.savingsDeposit → prisma.savingsDeposit)

3. lib/db.ts:
   הסר את השורה: export const db = prisma
   (אחרי שאין יותר שימוש ב-db)

אל תשנה לוגיקה — רק שמות משתנים.
```

---

# פרומפט 11 — קוד: תיקון טיפוסי any

## הבעיה
כמה מקומות משתמשים ב-`any[]` במקום טיפוסים מדויקים.

## הפרומפט

```
📎 @app/settings/page.tsx @components/transactions/TransactionForm.tsx

תקן שימוש ב-any[] בשני קבצים:

1. app/settings/page.tsx שורה 73 בערך:
   שנה: const [categories, setCategories] = useState<any[]>([]);
   ל: const [categories, setCategories] = useState<Array<{
     id: string;
     name: string;
     icon: string | null;
     color: string | null;
     type: string;
     isFixed: boolean;
     isDefault: boolean;
     isActive: boolean;
     parentId: string | null;
     parentName: string | null;
     sortOrder: number;
     transactionCount: number;
     budgetItemCount: number;
   }>>([]);

   גם שנה editingCategory:
   שנה: const [editingCategory, setEditingCategory] = useState<any | null>(null);
   ל: const [editingCategory, setEditingCategory] = useState<typeof categories[number] | null>(null);

2. components/transactions/TransactionForm.tsx שורה 68 בערך:
   שנה: const [categories, setCategories] = useState<any[]>([]);
   ל: const [categories, setCategories] = useState<Array<{
     id: string;
     name: string;
     icon: string | null;
     color: string | null;
     type: string;
     isFixed: boolean;
     sortOrder: number;
   }>>([]);

אל תשנה שום דבר אחר בקבצים.
```

---

# פרומפט 12 — ביצועים: loading.tsx לכל route

## הבעיה
Next.js משתמש ב-loading.tsx כ-Suspense boundary אוטומטי. חסרים loading files לדפים שטוענים נתונים.

## הפרומפט

```
צור 3 קבצי loading חדשים (בנוסף לאלה שיצרנו בפרומפט 4):

קובץ 1: app/transactions/loading.tsx
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsLoading() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 pb-24 md:pb-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
```

קובץ 2: app/budget/loading.tsx
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
```

קובץ 3: app/reports/loading.tsx
```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
```

צור את 3 הקבצים. אל תשנה קבצים קיימים.
```

---

# סיכום ממצאים נוספים (לא דורשים תיקון מיידי)

## דברים שעובדים טוב ✅
- **מבנה Prisma Schema** — מלא ונכון, כל 8 הטבלאות מוגדרות כמו באפיון
- **Server Actions** — כל ה-CRUD לכל ישות מוגדר עם ולידציה (Zod), טיפול בשגיאות, והמרת Decimal
- **Zustand store** — נקי, פשוט, עובד
- **RTL layout** — html dir="rtl", Heebo font, Sidebar ב-right-0, border-l
- **Empty states** — כל דף מטפל במצב ריק
- **Error boundary** — app/error.tsx מזהה שגיאות DB ומציג הודעה מתאימה
- **PWA** — מוגדר עם next-pwa, manifest, service worker
- **Export** — ייצוא לExcel ו-PDF מוגדר
- **עסקאות חוזרות** — לוגיקה אוטומטית מלאה עם מניעת כפילויות
- **גיבוי ושחזור** — מלא עם ייצוא/ייבוא JSON

## דברים לשיפור בעתיד (לא דחוף)
- **metadata warnings** — viewport ו-themeColor צריכים לעבור מ-metadata ל-viewport export (Next.js 14+)
- **Tailwind delay classes** — `delay-[400ms]` ו-`delay-[500ms]` גורמים לאזהרות. אפשר להחליף ב-delay-300 ו-delay-500 (מוגדרים מראש)
- **Security** — הסיסמאות שונו, env vars מוגדרים ב-Vercel
- **DB Region** — Vercel ב-iad1 (Washington DC), Supabase ב-EU — זה מוסיף latency. אפשר לשנות Region ב-Vercel ל-Frankfurt

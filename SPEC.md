# 📋 מסמך אפיון מלא — "כלכלת הבית" (KalkalatHaBait)

## אפליקציית ניהול תקציב משפחתי — Web + PWA

---

## תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [החלטות טכנולוגיות — Tech Stack](#2-החלטות-טכנולוגיות)
3. [ארכיטקטורה ומבנה הפרויקט](#3-ארכיטקטורה)
4. [מבנה בסיס הנתונים](#4-בסיס-נתונים)
5. [אפיון מסכים ו-UX/UI](#5-אפיון-מסכים)
6. [לוגיקה עסקית וחישובים](#6-לוגיקה-עסקית)
7. [קטגוריות ברירת מחדל](#7-קטגוריות)
8. [PWA והתקנה](#8-pwa)
9. [תוכנית פיתוח שלבית](#9-תוכנית-פיתוח)
10. [הנחיות ל-Cursor IDE](#10-הנחיות-cursor)
11. [ביקורת עצמית ושיפורים](#11-ביקורת)

---

## 1. סקירה כללית

### 1.1 מהות המוצר
אפליקציית ווב (PWA) לניהול תקציב משפחתי בעברית, מבוססת על מתודולוגיית מעקב שבועי עם הפרדה בין הוצאות קבועות למשתנות. האפליקציה מיועדת למשתמש יחיד (ללא מערכת הרשמה/כניסה).

### 1.2 עקרונות מנחים
- **פשטות קודם** — ממשק נקי, לא מציף את המשתמש
- **מובייל-פירסט** — עיצוב ראשי למובייל, מתרחב למחשב
- **RTL מלא** — כל הממשק בעברית, כולל גרפים ותרשימים
- **מחזור תקציבי** — מה-11 בחודש עד ה-10 בחודש הבא (יום המשכורת)
- **שנה קלנדרית** — ינואר עד דצמבר
- **Offline-capable** — עבודה בסיסית גם ללא אינטרנט (PWA)

### 1.3 קהל יעד
משפחה ישראלית שרוצה לנהל תקציב בצורה מסודרת — לעקוב אחרי הכנסות והוצאות, לתכנן תקציב חודשי, לנהל הלוואות, ולעקוב אחר מטרות חיסכון.

---

## 2. החלטות טכנולוגיות — Tech Stack

### 2.1 סיכום טכנולוגי

| רכיב | טכנולוגיה | סיבה |
|-------|-----------|------|
| **Framework** | Next.js 14 (App Router) | Fullstack בקוד-בייס אחד, Cursor מכיר מצוין |
| **שפת תכנות** | TypeScript | בטיחות טיפוסים, Cursor עובד טוב יותר עם TS |
| **עיצוב** | Tailwind CSS + shadcn/ui | מהיר, RTL-ready, רכיבים מוכנים |
| **גרפים** | Recharts | React-native, RTL support, פשוט |
| **בסיס נתונים** | Supabase (PostgreSQL) | חינמי, קל להקמה, API אוטומטי |
| **ORM** | Prisma | Type-safe, Cursor IDE אוהב אותו |
| **אחסון** | Vercel (Hosting) + Supabase (DB) | שניהם חינמיים |
| **PWA** | next-pwa / Serwist | תמיכה מובנית ב-Next.js |
| **ייצוא** | xlsx (ספריית JS) + jsPDF | ייצוא דוחות |
| **אייקונים** | Lucide React | קלילים, מתאימים ל-shadcn |
| **ניהול תאריכים** | date-fns | קלילה, תמיכה ב-locale עברי |
| **ניהול מצב** | Zustand | פשוט, קל, מתאים לפרויקט הזה |
| **ולידציה** | Zod | ולידציית טפסים type-safe |

### 2.2 למה הסטאק הזה?

**Next.js 14** — הבחירה המושלמת ל-vibe coding עם Cursor:
- קוד-בייס אחד לפרונט ולבאק (API Routes)
- קהילה ענקית = Cursor יודע לייצר קוד איכותי
- Deploy חינמי ב-Vercel בלחיצת כפתור
- Server Components לביצועים מצוינים
- App Router עם layout מובנה (מושלם לניווט RTL)

**Supabase** — בסיס נתונים חינמי ומעולה:
- PostgreSQL אמיתי (לא NoSQL)
- חינמי עד 500MB + 50K שורות פעילות
- ממשק ניהול ויזואלי (לא צריך SQL ידני)
- API אוטומטי (REST + Realtime)
- גיבויים אוטומטיים

**shadcn/ui** — לא ספריית רכיבים רגילה:
- הקוד נמצא אצלך בפרויקט (לא npm dependency)
- מתאים מצוין ל-Tailwind ול-RTL
- Cursor יודע לעבוד איתו מצוין
- רכיבים מקצועיים: Dialog, Sheet, Dropdown, Toast, Charts

### 2.3 Tier חינמי — גבולות

| שירות | Tier חינמי | מספיק? |
|--------|-----------|--------|
| Vercel | 100GB bandwidth/חודש, builds ללא הגבלה | ✅ בהחלט |
| Supabase | 500MB DB, 1GB storage, 50K שורות | ✅ לשנים |
| GitHub | repos ללא הגבלה | ✅ |

---

## 3. ארכיטקטורה ומבנה הפרויקט

### 3.1 מבנה תיקיות

```
kalkalat-habait/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout ראשי (RTL, font, sidebar)
│   ├── page.tsx                  # דשבורד ראשי
│   ├── globals.css               # סגנונות גלובליים + RTL
│   ├── transactions/
│   │   └── page.tsx              # דף הכנסות והוצאות
│   ├── budget/
│   │   └── page.tsx              # דף תקציב חודשי
│   ├── savings/
│   │   └── page.tsx              # דף מטרות חיסכון
│   ├── loans/
│   │   └── page.tsx              # דף הלוואות וחובות
│   ├── reports/
│   │   └── page.tsx              # דף דוחות וניתוחים
│   ├── settings/
│   │   └── page.tsx              # הגדרות (קטגוריות, העדפות)
│   └── api/                      # API Routes (Backend)
│       ├── transactions/
│       │   └── route.ts
│       ├── budgets/
│       │   └── route.ts
│       ├── categories/
│       │   └── route.ts
│       ├── loans/
│       │   └── route.ts
│       ├── savings/
│       │   └── route.ts
│       ├── reports/
│       │   └── route.ts
│       └── export/
│           └── route.ts
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx           # תפריט צד ימין
│   │   ├── MobileNav.tsx         # ניווט תחתון (מובייל)
│   │   ├── Header.tsx            # כותרת עליונה
│   │   └── MonthSelector.tsx     # בורר חודש גלובלי
│   ├── dashboard/
│   │   ├── SummaryCards.tsx       # כרטיסי סיכום
│   │   ├── ExpenseChart.tsx      # גרף הוצאות
│   │   ├── WeeklyChart.tsx       # גרף שבועי
│   │   ├── BudgetProgress.tsx    # פס התקדמות תקציב
│   │   └── RecentTransactions.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx   # טופס הוספת עסקה
│   │   ├── TransactionList.tsx   # רשימת עסקאות
│   │   ├── QuickAdd.tsx          # הוספה מהירה (FAB)
│   │   └── WeeklyView.tsx        # תצוגה שבועית
│   ├── budget/
│   │   ├── BudgetTable.tsx       # טבלת תקציב
│   │   ├── CategoryBudget.tsx    # תקציב לפי קטגוריה
│   │   └── BudgetVsActual.tsx    # השוואה תקציב/בפועל
│   ├── charts/
│   │   ├── PieChart.tsx          # עוגה - הוצאות לפי קטגוריה
│   │   ├── BarChart.tsx          # עמודות - חודש מול חודש
│   │   ├── LineChart.tsx         # קווים - מגמות
│   │   └── ProgressBar.tsx       # פס התקדמות
│   ├── loans/
│   │   ├── LoanForm.tsx
│   │   ├── LoanList.tsx
│   │   └── PaymentSchedule.tsx
│   └── savings/
│       ├── SavingsGoalForm.tsx
│       ├── SavingsGoalCard.tsx
│       └── SavingsProgress.tsx
├── lib/
│   ├── db.ts                     # Prisma client
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # פונקציות עזר
│   ├── calculations.ts           # לוגיקת חישובים
│   ├── constants.ts              # קבועים (קטגוריות ברירת מחדל)
│   ├── formatters.ts             # פורמט מטבע, תאריכים
│   └── export.ts                 # ייצוא Excel/PDF
├── hooks/
│   ├── useTransactions.ts
│   ├── useBudget.ts
│   ├── useMonthNavigation.ts     # ניווט בין חודשים
│   └── useCalculations.ts
├── stores/
│   └── appStore.ts               # Zustand store
├── prisma/
│   ├── schema.prisma             # סכמת בסיס הנתונים
│   └── seed.ts                   # נתוני ברירת מחדל
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker
│   ├── icons/                    # אייקוני PWA
│   └── fonts/                    # פונט עברי (Heebo)
├── types/
│   └── index.ts                  # TypeScript types
├── .env.local                    # משתני סביבה
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.2 זרימת נתונים

```
[משתמש] → [React Components] → [Server Actions / API Routes] → [Prisma ORM] → [Supabase PostgreSQL]
                                                                       ↑
                                                              [לוגיקת חישובים]
```

---

## 4. בסיס נתונים — Prisma Schema

### 4.1 סכמה מלאה

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// === קטגוריות ===
model Category {
  id              String        @id @default(cuid())
  name            String        // שם הקטגוריה (עברית)
  icon            String?       // שם אייקון מ-Lucide
  color           String?       // צבע HEX
  type            CategoryType  // INCOME / EXPENSE
  isFixed         Boolean       @default(false) // קבועה או משתנה
  parentId        String?       // קטגוריית אב (null = קטגוריה ראשית)
  parent          Category?     @relation("SubCategories", fields: [parentId], references: [id])
  children        Category[]    @relation("SubCategories")
  sortOrder       Int           @default(0)
  isActive        Boolean       @default(true)
  isDefault       Boolean       @default(true) // קטגוריית מערכת
  createdAt       DateTime      @default(now())

  transactions    Transaction[]
  budgetItems     BudgetItem[]
}

enum CategoryType {
  INCOME
  EXPENSE
}

// === עסקאות (הכנסות והוצאות) ===
model Transaction {
  id              String          @id @default(cuid())
  amount          Decimal         @db.Decimal(10, 2)
  type            TransactionType // INCOME / EXPENSE
  categoryId      String
  category        Category        @relation(fields: [categoryId], references: [id])
  date            DateTime
  weekNumber      Int?            // שבוע 1-5 בחודש (null = קבועה)
  isFixed         Boolean         @default(false)
  notes           String?
  tags            String[]        // תגיות חופשיות
  isRecurring     Boolean         @default(false)  // חוזרת כל חודש?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([date])
  @@index([categoryId])
  @@index([type, date])
}

enum TransactionType {
  INCOME
  EXPENSE
}

// === תקציב חודשי ===
model BudgetItem {
  id              String   @id @default(cuid())
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  month           Int      // 1-12
  year            Int
  plannedAmount   Decimal  @db.Decimal(10, 2) // סכום מתוכנן
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([categoryId, month, year])
  @@index([month, year])
}

// === מטרות חיסכון ===
model SavingsGoal {
  id              String   @id @default(cuid())
  name            String   // שם המטרה (טיול, רכב, דירה)
  icon            String?
  targetAmount    Decimal  @db.Decimal(10, 2)
  currentAmount   Decimal  @db.Decimal(10, 2) @default(0)
  targetDate      DateTime?
  monthlyTarget   Decimal? @db.Decimal(10, 2) // הפקדה חודשית רצויה
  color           String?
  isCompleted     Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  deposits        SavingsDeposit[]
}

model SavingsDeposit {
  id              String      @id @default(cuid())
  goalId          String
  goal            SavingsGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)
  amount          Decimal     @db.Decimal(10, 2)
  date            DateTime
  notes           String?
  createdAt       DateTime    @default(now())
}

// === הלוואות וחובות ===
model Loan {
  id              String     @id @default(cuid())
  name            String     // שם ההלוואה
  type            LoanType   // MORTGAGE / BANK / EXTERNAL / CREDIT / OTHER
  originalAmount  Decimal    @db.Decimal(10, 2) // סכום מקורי
  remainingAmount Decimal    @db.Decimal(10, 2) // יתרה
  monthlyPayment  Decimal    @db.Decimal(10, 2) // תשלום חודשי
  interestRate    Decimal?   @db.Decimal(5, 3)  // ריבית שנתית
  startDate       DateTime
  endDate         DateTime?
  totalPayments   Int?       // מספר תשלומים כולל
  remainingPayments Int?     // תשלומים שנותרו
  notes           String?
  isActive        Boolean    @default(true)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  payments        LoanPayment[]
}

enum LoanType {
  MORTGAGE      // משכנתא
  BANK          // הלוואת בנק
  EXTERNAL      // חוץ בנקאי
  CREDIT        // כרטיס אשראי
  OTHER         // אחר
}

model LoanPayment {
  id              String   @id @default(cuid())
  loanId          String
  loan            Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  amount          Decimal  @db.Decimal(10, 2)
  principalAmount Decimal? @db.Decimal(10, 2) // קרן
  interestAmount  Decimal? @db.Decimal(10, 2) // ריבית
  date            DateTime
  notes           String?
  createdAt       DateTime @default(now())
}

// === הגדרות אפליקציה ===
model AppSettings {
  id              String   @id @default("default")
  payday          Int      @default(11)      // יום המשכורת
  currency        String   @default("ILS")
  startMonth      Int      @default(1)       // חודש התחלה (ינואר)
  weekStartDay    Int      @default(0)       // 0=ראשון
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 4.2 דיאגרמת קשרים

```
Category (1) ──→ (N) Transaction
Category (1) ──→ (N) BudgetItem
Category (1) ──→ (N) Category (sub-categories)
SavingsGoal (1) ──→ (N) SavingsDeposit
Loan (1) ──→ (N) LoanPayment
```

---

## 5. אפיון מסכים ו-UX/UI

### 5.1 עקרונות עיצוב

**סגנון:** שילוב של ניקיון ופשטות (כמו Riseup) עם עושר מידע ודשבורד (כמו Moneytor):
- **מ-Riseup:** קלאפים נקיים, שפה חמה ואישית, צבעים רכים, מספרים גדולים ובולטים
- **מ-Moneytor:** דשבורד מקיף, גרפים אינפורמטיביים, סיכומי ביצועים

**צבעי מותג:**

| תפקיד | צבע | שימוש |
|--------|-----|-------|
| Primary | `#0891B2` (Cyan-600) | כפתורים, הדגשות |
| Success/Income | `#10B981` (Emerald-500) | הכנסות, חיובי |
| Danger/Expense | `#EF4444` (Red-500) | חריגות, גירעון |
| Warning | `#F59E0B` (Amber-500) | התראות, קרוב לגבול |
| Background | `#F8FAFC` (Slate-50) | רקע כללי |
| Card BG | `#FFFFFF` | כרטיסים |
| Text Primary | `#1E293B` (Slate-800) | טקסט ראשי |
| Text Secondary | `#64748B` (Slate-500) | טקסט משני |

**טיפוגרפיה:**
- פונט: **Heebo** (Google Fonts) — פונט עברי מודרני ונקי
- כותרות: Heebo Bold 700
- גוף: Heebo Regular 400
- מספרים: Heebo Medium 500 (בגודל בולט)

**Spacing ו-Layout:**
- ריווח בסיסי: 16px
- Border radius: 12px (כרטיסים), 8px (כפתורים)
- צללים: `shadow-sm` על כרטיסים, `shadow-md` על modals

### 5.2 ניווט

**מובייל (Bottom Navigation Bar):**
```
┌─────────────────────────────────┐
│  [דוחות] [חיסכון] [תקציב] [בית]  │
│    📊      🎯      📋     🏠    │
└─────────────────────────────────┘
         + כפתור FAB צף להוספה מהירה
```

**דסקטופ (Sidebar ימני):**
```
┌──────────────┬─────────────────────┐
│              │                     │
│  🏠 דשבורד   │                     │
│  💰 עסקאות   │    תוכן ראשי        │
│  📋 תקציב    │                     │
│  🎯 חיסכון   │                     │
│  🏦 הלוואות  │                     │
│  📊 דוחות    │                     │
│  ──────────  │                     │
│  ⚙️ הגדרות  │                     │
│              │                     │
└──────────────┴─────────────────────┘
```

### 5.3 מסך 1: דשבורד ראשי (/)

**Header גלובלי:**
```
┌──────────────────────────────────────────┐
│  [< חודש קודם]   פברואר 2026   [חודש הבא >]  │
│                  ⚙️ הגדרות                │
└──────────────────────────────────────────┘
```

**כרטיסי סיכום (Summary Cards) — שורה עליונה:**
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ 💰 הכנסות │  │ 💸 הוצאות │  │ 📊 מאזן  │
│           │  │           │  │          │
│  24,832₪  │  │  27,640₪  │  │ -2,808₪  │
│  ↑3.2%    │  │  ↑12%     │  │  גירעון  │
└──────────┘  └──────────┘  └──────────┘
```
- הכנסות בירוק, הוצאות באדום, מאזן בצבע דינמי (ירוק/אדום)
- חץ + אחוז שינוי מהחודש הקודם

**פס התקדמות תקציב כללי:**
```
┌────────────────────────────────────────┐
│  ניצול תקציב חודשי                     │
│  ████████████████████░░░░░░  78%       │
│  21,500₪ מתוך 27,500₪                 │
│  נותרו: 6,000₪ ל-12 ימים              │
└────────────────────────────────────────┘
```

**גרף עוגה — הוצאות לפי קטגוריה:**
- עוגה צבעונית עם 5-6 קטגוריות גדולות + "אחר"
- לחיצה על פלח → פירוט תת-קטגוריות

**גרף עמודות שבועי:**
- 5 עמודות (שבוע 1-5)
- מציג הוצאות משתנות בלבד (כמו באקסל)
- קו אופקי מקווקו = ממוצע שבועי רצוי

**5 עסקאות אחרונות:**
- רשימה קומפקטית: אייקון קטגוריה + שם + סכום + תאריך
- לחיצה → עריכה

**התראות (אם יש):**
```
┌────────────────────────────────────┐
│ ⚠️ הוצאות אוכל עברו 90% מהתקציב   │
│ ⚠️ הריבית על המשכנתא גבוהה ב-4%    │
└────────────────────────────────────┘
```

### 5.4 מסך 2: עסקאות (/transactions)

**תצוגה ראשית — רשימה כרונולוגית:**
```
┌────────────────────────────────────────┐
│ [הכל] [הכנסות] [הוצאות] [קבועות]      │
├────────────────────────────────────────┤
│  📅 היום - 7 בפברואר                   │
│  ┌────────────────────────────────┐   │
│  │ 🛒 סופר   -350₪   אוכל ומכולת│   │
│  │ ⛽ דלק    -280₪   רכב        │   │
│  └────────────────────────────────┘   │
│                                        │
│  📅 אתמול - 6 בפברואר                  │
│  ┌────────────────────────────────┐   │
│  │ 🍕 אוכל בחוץ  -120₪  מסעדות  │   │
│  └────────────────────────────────┘   │
│                                        │
│  📅 הוצאות קבועות - פברואר             │
│  ┌────────────────────────────────┐   │
│  │ 🏠 משכנתא    -4,650₪  דיור   │   │
│  │ 👶 מעון      -2,628₪  ילדים  │   │
│  │ ⚡ חשמל      -672₪    דיור   │   │
│  └────────────────────────────────┘   │
├────────────────────────────────────────┤
│             ＋ הוספת עסקה              │
└────────────────────────────────────────┘
```

**תצוגה שבועית (toggle):**
- טבלה כמו באקסל — שורות = קטגוריות, עמודות = שבועות 1-5
- מציגה סכומים בפועל מול תקציב

**טופס הוספת עסקה (Bottom Sheet / Modal):**
```
┌────────────────────────────────────────┐
│           הוספת הוצאה                  │
├────────────────────────────────────────┤
│  סכום:  [_____________] ₪             │
│                                        │
│  קטגוריה:  [▼ אוכל ומכולת ──────]     │
│  תת-קטגוריה: [▼ סופר ──────────]     │
│                                        │
│  תאריך:  [📅 07/02/2026]              │
│                                        │
│  סוג:  (●) משתנה  ( ) קבועה          │
│                                        │
│  🔄 חוזרת כל חודש?  [  ]              │
│                                        │
│  הערות: [_________________________]    │
│  תגיות: [_________________________]    │
│                                        │
│  [ביטול]              [💾 שמור]        │
└────────────────────────────────────────┘
```

**UX חכם:**
- ברירת מחדל = הוצאה (לא הכנסה, כי זה 90% מהשימוש)
- מקלדת נומרית נפתחת אוטומטית בשדה סכום
- בחירת קטגוריה עם אייקונים ויזואליים (grid של אייקונים)
- "חוזרת כל חודש" — תיצור עסקה קבועה שתשוכפל אוטומטית

### 5.5 מסך 3: תקציב (/budget)

**Header:**
```
┌────────────────────────────────────────┐
│  תקציב פברואר 2026                    │
│  [העתק מחודש קודם]  [אפס הכל]        │
└────────────────────────────────────────┘
```

**טבלת תקציב:**
```
┌──────────────┬──────────┬──────────┬──────────┬───────┐
│ קטגוריה      │ תקציב    │ בפועל    │ נותר     │ %     │
├──────────────┼──────────┼──────────┼──────────┼───────┤
│ 🏠 דיור      │ 7,500₪  │ 6,881₪  │ 619₪    │ 92%   │
│ ████████████████████░░                        │
│ 👶 ילדים     │ 4,000₪  │ 3,200₪  │ 800₪    │ 80%   │
│ ████████████████░░░░░░                        │
│ 🛒 אוכל      │ 3,500₪  │ 3,800₪  │ -300₪   │ 109%  │
│ ████████████████████████ ⚠️ חריגה!             │
│ ...                                           │
├──────────────┼──────────┼──────────┼──────────┼───────┤
│ סה"כ         │ 24,000₪ │ 21,500₪ │ 2,500₪  │ 90%   │
└──────────────┴──────────┴──────────┴──────────┴───────┘
```

- פס צבעוני: ירוק (0-70%), צהוב (70-90%), כתום (90-100%), אדום (100%+)
- לחיצה על קטגוריה → פירוט תת-קטגוריות
- עריכה inline של סכום תקציב (לחיצה על המספר)

### 5.6 מסך 4: מטרות חיסכון (/savings)

**כרטיסי מטרות:**
```
┌────────────────────────────────────┐
│  🏖️ טיול משפחתי                    │
│                                    │
│  ████████████████░░░░░░  65%       │
│  13,000₪ מתוך 20,000₪             │
│                                    │
│  📅 יעד: אוגוסט 2026              │
│  💰 נדרש: 1,750₪/חודש             │
│                                    │
│  [➕ הפקדה]                        │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  🚗 רכב חדש                       │
│                                    │
│  ██████░░░░░░░░░░░░░░░░  25%      │
│  25,000₪ מתוך 100,000₪            │
│  ...                               │
└────────────────────────────────────┘
```

### 5.7 מסך 5: הלוואות וחובות (/loans)

**סיכום עליון:**
```
┌──────────────────────────────────────┐
│  סה"כ חובות: 450,000₪               │
│  תשלום חודשי כולל: 6,200₪           │
│  צפי סיום כל החובות: מרץ 2035       │
└──────────────────────────────────────┘
```

**רשימת הלוואות:**
```
┌────────────────────────────────────┐
│  🏠 משכנתא — הפועלים               │
│  יתרה: 380,000₪  │  4,650₪/חודש   │
│  ריבית: 3.5%  │  נותרו: 82 תשלומים │
│  ████████████████████░░░░░  78%    │
│  [פירוט תשלומים]                   │
├────────────────────────────────────┤
│  🏦 הלוואת בנק                     │
│  יתרה: 45,000₪  │  1,200₪/חודש    │
│  ריבית: 5.2%  │  נותרו: 38 תשלומים │
│  ...                               │
├────────────────────────────────────┤
│  ➕ הוספת הלוואה                    │
└────────────────────────────────────┘
```

### 5.8 מסך 6: דוחות (/reports)

**תפריט דוחות:**
- דוח חודשי מפורט
- השוואת חודשים (side-by-side)
- ניתוח מגמות (גרף קווים 12 חודשים)
- הוצאות לפי קטגוריה (Treemap / עוגה)
- ניתוח הוצאות קבועות מול משתנות
- ייצוא Excel / PDF

**דוח חודשי:**
```
┌────────────────────────────────────────┐
│  📊 דוח פברואר 2026                   │
├────────────────────────────────────────┤
│  [גרף עוגה: הוצאות לפי קטגוריה]      │
│                                        │
│  [גרף עמודות: שבועי]                  │
│                                        │
│  📋 סיכום:                             │
│  • הכנסות: 24,832₪                    │
│  • הוצאות קבועות: 15,200₪             │
│  • הוצאות משתנות: 12,440₪             │
│  • מאזן: -2,808₪                      │
│                                        │
│  💡 תובנות:                            │
│  • הוצאות אוכל עלו ב-15% מהחודש הקודם │
│  • חסכת 800₪ בקטגוריית תחבורה        │
│                                        │
│  [📥 ייצוא Excel]  [📥 ייצוא PDF]     │
└────────────────────────────────────────┘
```

**השוואת חודשים:**
```
┌────────────────────────────────────────────────────┐
│  [▼ ינואר 2026]  מול  [▼ דצמבר 2025]             │
├────────────────────────────────────────────────────┤
│  [גרף עמודות כפולות: קטגוריה מול קטגוריה]        │
│                                                    │
│  קטגוריה    │ ינואר    │ דצמבר   │ שינוי          │
│  ──────────────────────────────────────            │
│  דיור       │ 6,881₪  │ 6,900₪  │ -0.3% ↓        │
│  אוכל       │ 3,800₪  │ 3,300₪  │ +15% ↑ ⚠️      │
└────────────────────────────────────────────────────┘
```

### 5.9 מסך 7: הגדרות (/settings)

- ניהול קטגוריות (הוספה, עריכה, מחיקה, שינוי סדר)
- יום המשכורת (ברירת מחדל: 11)
- ייבוא נתונים (CSV)
- ייצוא/גיבוי כל הנתונים
- איפוס נתונים
- מידע אודות האפליקציה

---

## 6. לוגיקה עסקית וחישובים

### 6.1 חישובי ליבה (lib/calculations.ts)

```typescript
// === חישובים מרכזיים ===

// סה"כ הכנסות לחודש
totalIncome(month, year) = SUM(transactions WHERE type=INCOME AND month AND year)

// סה"כ הוצאות לחודש
totalExpenses(month, year) = SUM(transactions WHERE type=EXPENSE AND month AND year)

// מאזן חודשי
balance(month, year) = totalIncome - totalExpenses

// הוצאות קבועות
fixedExpenses(month, year) = SUM(transactions WHERE isFixed=true AND type=EXPENSE)

// הוצאות משתנות
variableExpenses(month, year) = totalExpenses - fixedExpenses

// ניצול תקציב לקטגוריה
budgetUsage(categoryId, month, year) = actualSpent / plannedBudget * 100

// נותר מהתקציב
budgetRemaining(categoryId, month, year) = plannedBudget - actualSpent

// הוצאות לפי שבוע
weeklyExpenses(weekNumber, month, year) = SUM(transactions WHERE weekNumber=N)

// ממוצע שבועי
weeklyAverage(month, year) = variableExpenses / weeksInMonth

// שינוי חודשי (%)
monthlyChange(month, year) = ((thisMonth - lastMonth) / lastMonth) * 100
```

### 6.2 חישוב מספר שבוע בחודש

```typescript
// מספר שבוע מחושב אוטומטית לפי תאריך העסקה
function getWeekNumber(date: Date): number {
  const dayOfMonth = date.getDate();
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  if (dayOfMonth <= 28) return 4;
  return 5;
}
```

### 6.3 התראות אוטומטיות

```typescript
// מנגנון התראות
const ALERT_THRESHOLDS = {
  WARNING: 80,    // 80% ניצול — צהוב
  DANGER: 95,     // 95% ניצול — כתום
  EXCEEDED: 100,  // 100%+ — אדום
};

// בדיקה בכל הוספת עסקה
function checkBudgetAlerts(categoryId, month, year) {
  const usage = budgetUsage(categoryId, month, year);
  if (usage >= EXCEEDED) return { level: 'error', message: 'חרגת מהתקציב!' };
  if (usage >= DANGER) return { level: 'warning', message: 'כמעט הגעת לגבול' };
  if (usage >= WARNING) return { level: 'info', message: 'שים לב, ניצלת 80%' };
  return null;
}
```

### 6.4 חישובי הלוואות

```typescript
// עדכון יתרה אחרי תשלום
remainingAmount = remainingAmount - principalAmount;
remainingPayments = remainingPayments - 1;

// חישוב צפי סיום
estimatedEndDate = addMonths(today, remainingPayments);

// סה"כ ריבית שתשולם
totalInterest = (monthlyPayment * totalPayments) - originalAmount;
```

### 6.5 עסקאות חוזרות

```typescript
// בכל תחילת חודש (או בכניסה ראשונה לחודש חדש)
// המערכת תשכפל אוטומטית עסקאות שמסומנות כ-isRecurring=true
function generateRecurringTransactions(month, year) {
  const recurring = getRecurringTransactions();
  recurring.forEach(tx => {
    createTransaction({
      ...tx,
      date: new Date(year, month - 1, tx.originalDay),
      isRecurring: true
    });
  });
}
```

---

## 7. קטגוריות ברירת מחדל

### 7.1 הכנסות

| # | קטגוריה | אייקון | קבועה? |
|---|---------|--------|--------|
| 1 | משכורת 1 | 💼 Briefcase | ✅ |
| 2 | משכורת 2 | 💼 Briefcase | ✅ |
| 3 | קצבת ילדים | 👶 Baby | ✅ |
| 4 | עסק / פרילנס | 🏪 Store | משתנה |
| 5 | הכנסה נוספת 1 | 💰 Coins | משתנה |
| 6 | הכנסה נוספת 2 | 💰 Coins | משתנה |

### 7.2 הוצאות — 14 קטגוריות ראשיות

(מבוסס על קובץ האקסל של משפחת חן)

| # | קטגוריה | אייקון | תתי-קטגוריות |
|---|---------|--------|-------------|
| 1 | תקשורת | 📱 Smartphone | טלפון קווי, סלולר, אינטרנט, טלוויזיה, סטרימינג, עיתונים, אחסון ענן |
| 2 | דיור | 🏠 Home | חשמל, ארנונה, גז, מים, שכר דירה/משכנתא, ועד בית, אבטחה, עוזרת/גינון |
| 3 | ילדים וחינוך | 👶 GraduationCap | מטפלת, מעון, צהרון, סל תרבות, חוגים, הוצאות גן, אוניברסיטה |
| 4 | ביטוחים | 🛡️ Shield | קופת חולים, ביטוח בריאות, ביטוח חיים, ביטוח דירה, ביטוח משכנתא |
| 5 | תחבורה | 🚌 Bus | ביטוח רכב, תחבורה ציבורית |
| 6 | מימון ובנק | 🏦 Landmark | הלוואות בנק, הלוואות חוץ-בנקאי, חובות, ריבית, עמלות |
| 7 | חיסכון | 🐷 PiggyBank | השתלמות, פיקדון, קופת גמל, אחר |
| 8 | שונות | 📦 Package | מזונות, חניה/כביש 6, תרומות, מנויים, כושר, מוצרים לבית, הוצאות לא מתוכננות |
| 9 | אוכל וקניות | 🛒 ShoppingCart | מכולת, אוכל בחוץ, פארם, סיגריות |
| 10 | טיפוח ויופי | ✨ Sparkles | טיפולים, מוצרים, מספרה |
| 11 | הוצאות רפואיות | ❤️‍🩹 HeartPulse | תרופות, שיניים, טיפולים |
| 12 | רכב | 🚗 Car | דלק, שטיפה, טיפולים |
| 13 | תרבות ופנאי | 🎭 Drama | בילויים, מתנות, ימי הולדת, צעצועים, שמרטף, דמי כיס |
| 14 | שונות נוספות | 📎 Paperclip | חיות מחמד, ביגוד, מזומן ללא מעקב, קלינאית |

---

## 8. PWA — Progressive Web App

### 8.1 manifest.json

```json
{
  "name": "כלכלת הבית — ניהול תקציב משפחתי",
  "short_name": "כלכלת הבית",
  "description": "אפליקציה לניהול תקציב וכלכלת המשפחה",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "dir": "rtl",
  "lang": "he",
  "background_color": "#F8FAFC",
  "theme_color": "#0891B2",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 8.2 Service Worker

- Cache-first לנכסים סטטיים (CSS, JS, fonts, icons)
- Network-first ל-API calls
- Offline fallback page עם הודעה: "אין חיבור — נתונים יסונכרנו כשתחזור אונליין"

### 8.3 התקנה

- באנר התקנה אוטומטי באנדרואיד (Chrome)
- כפתור "התקן אפליקציה" בהגדרות
- אייקון על מסך הבית

---

## 9. תוכנית פיתוח שלבית

### שלב 1: תשתית (1-2 ימים)
```
□ יצירת פרויקט Next.js עם TypeScript
□ הגדרת Tailwind CSS + RTL (direction: rtl)
□ התקנת shadcn/ui + Heebo font
□ הקמת Supabase project + Prisma schema
□ Layout ראשי: Sidebar + Mobile Navigation + Header
□ בורר חודש גלובלי (MonthSelector)
□ הגדרת PWA (manifest + service worker)
```

### שלב 2: קטגוריות + עסקאות (2-3 ימים)
```
□ Seed קטגוריות ברירת מחדל
□ דף עסקאות — רשימה כרונולוגית
□ טופס הוספת עסקה (Bottom Sheet)
□ הוספה מהירה (Quick Add FAB)
□ עריכה ומחיקה של עסקאות
□ סינון לפי סוג/קטגוריה/שבוע
□ עסקאות חוזרות — סימון ויצירה אוטומטית
□ תצוגה שבועית (Weekly View)
```

### שלב 3: דשבורד (1-2 ימים)
```
□ כרטיסי סיכום (הכנסות, הוצאות, מאזן)
□ פס התקדמות תקציב כללי
□ גרף עוגה — הוצאות לפי קטגוריה
□ גרף עמודות שבועי
□ 5 עסקאות אחרונות
□ התראות על חריגות
```

### שלב 4: תקציב (1-2 ימים)
```
□ טבלת תקציב חודשי לפי קטגוריה
□ עריכה inline של סכומי תקציב
□ פסי התקדמות צבעוניים
□ העתקת תקציב מחודש קודם
□ חישוב ניצול אוטומטי
□ התראות חריגה
```

### שלב 5: חיסכון + הלוואות (1-2 ימים)
```
□ כרטיסי מטרות חיסכון + CRUD
□ הפקדות למטרות
□ חישוב הפקדה חודשית נדרשת
□ רשימת הלוואות + CRUD
□ תשלומי הלוואה
□ חישוב יתרה וצפי סיום
```

### שלב 6: דוחות (1-2 ימים)
```
□ דוח חודשי מפורט
□ השוואת חודשים
□ גרף מגמות 12 חודשים
□ ניתוח קבועות מול משתנות
□ ייצוא Excel (xlsx)
□ ייצוא PDF (jsPDF)
```

### שלב 7: הגדרות + ליטוש (1-2 ימים)
```
□ ניהול קטגוריות (CRUD)
□ הגדרות אפליקציה
□ ייבוא/ייצוא נתונים
□ אנימציות ומעברים
□ בדיקת RTL מלאה
□ בדיקת PWA על אנדרואיד
□ ביצועים ואופטימיזציה
□ Deploy לVercel
```

**סה"כ משוער: 8-15 ימים** (תלוי בקצב העבודה עם Cursor)

---

## 10. הנחיות ל-Cursor IDE

### 10.1 כללים גלובליים לכל הפרויקט

```markdown
## Project Rules (שמור כ-.cursorrules בתיקיית הפרויקט)

### שפה וכיוון
- הממשק כולו בעברית
- כל ה-HTML חייב dir="rtl"
- Tailwind: השתמש ב-`rtl:` modifier כשצריך
- Layout ראשי: `<html lang="he" dir="rtl">`
- כל הטקסטים, placeholders, labels, tooltips — בעברית
- מטבע: ₪ (שקל חדש), פורמט: 1,234₪ (ללא רווח לפני הסימן)

### סגנון קוד
- TypeScript strict mode
- React Server Components כברירת מחדל, "use client" רק כשצריך
- שמות קבצים ב-PascalCase (components), camelCase (hooks, utils)
- שמות משתנים ופונקציות באנגלית, הערות יכולות להיות בעברית
- אל תשתמש ב-any ב-TypeScript

### UI/UX
- Mobile-first: תמיד תתכנן קודם למסך צר (375px)
- Breakpoints: sm:640px, md:768px, lg:1024px
- פונט: Heebo מ-Google Fonts
- צבעים: Cyan-600 primary, Emerald-500 income, Red-500 expense
- Border radius: rounded-xl לכרטיסים, rounded-lg לכפתורים
- Shadow: shadow-sm לכרטיסים
- רכיבי shadcn/ui עם התאמות RTL

### בסיס נתונים
- Prisma ORM — אל תכתוב SQL ישירות
- Server Actions מועדפים על API Routes (פשוט יותר)
- ולידציה עם Zod בצד שרת

### מספרים ותאריכים
- פורמט מספרים: new Intl.NumberFormat('he-IL').format(num)
- פורמט מטבע: new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' })
- פורמט תאריך: date-fns עם locale he
- יום המשכורת: 11 לחודש
- שנה: ינואר עד דצמבר
```

### 10.2 פקודת התחלה (להריץ ב-Terminal)

```bash
# 1. יצירת פרויקט
npx create-next-app@latest kalkalat-habait --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 2. כניסה לתיקייה
cd kalkalat-habait

# 3. התקנת dependencies
npm install @prisma/client recharts date-fns zustand zod xlsx jspdf jspdf-autotable lucide-react
npm install -D prisma @types/node

# 4. shadcn/ui
npx shadcn-ui@latest init
# בחר: TypeScript, Default style, Slate, CSS variables: yes, tailwind.config.ts, @/components, @/lib/utils

# 5. רכיבי shadcn נפוצים
npx shadcn-ui@latest add button card dialog sheet input label select tabs toast badge progress dropdown-menu separator calendar popover command

# 6. Prisma
npx prisma init

# 7. PWA
npm install next-pwa
```

### 10.3 הגדרות חשובות

**tailwind.config.ts — הוסף RTL:**
```typescript
// RTL כבר נתמך ב-Tailwind 3.3+ אוטומטית כשיש dir="rtl" ב-HTML
// הוסף פונט Heebo:
fontFamily: {
  sans: ['Heebo', 'sans-serif'],
}
```

**app/layout.tsx — דוגמה:**
```tsx
import { Heebo } from 'next/font/google';

const heebo = Heebo({ subsets: ['hebrew', 'latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" className={heebo.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 11. ביקורת עצמית ושיפורים

### 11.1 ביקורת על הגרסה הראשונית

**בעיה 1: חסרה התייחסות ל-Offline**
- הצהרתי על PWA אבל לא פירטתי מה יקרה ב-Offline
- **שיפור:** הוספתי סעיף 8.2 עם אסטרטגיית Service Worker מפורטת. בגרסה ראשונה, Offline יהיה צפייה בלבד (מטמון). בגרסה עתידית — IndexedDB לעסקאות שנוצרו אופליין עם סנכרון.

**בעיה 2: מורכבות מיותרת למשתמש יחיד**
- הסכמה המקורית כללה טבלאות Users ו-Families — מיותר לחלוטין!
- **שיפור:** הסרתי את הטבלאות הללו. המערכת עובדת ללא הרשמה/כניסה. פתיחת האפליקציה = כניסה ישירה לדשבורד. טבלת AppSettings שומרת את ההעדפות.

**בעיה 3: UX בהוספת עסקה — חיכוך מיותר**
- הטופס המקורי היה ארוך מדי עם הרבה שדות
- **שיפור:** עיצבתי מחדש — שדות חובה הם רק סכום, קטגוריה, ותאריך. כל השאר (הערות, תגיות, קבועה/חוזרת) הם אופציונליים ומתגלים בלחיצה על "פרטים נוספים". ברירות מחדל חכמות: סוג=הוצאה, תאריך=היום, שבוע=מחושב אוטומטית.

**בעיה 4: גרפים ב-RTL**
- לא התייחסתי לבעיית כיוון גרפים ב-RTL (ציר X הפוך)
- **שיפור:** Recharts תומך ב-RTL עם `reversed` prop על XAxis. הוספתי הנחיה ספציפית בסעיף Cursor.

**בעיה 5: חווית מובייל — Bottom Sheet**
- תיארתי Modal אבל ב-מובייל Bottom Sheet טוב יותר
- **שיפור:** שיניתי להשתמש ב-`Sheet` של shadcn (שנפתח מלמטה) במובייל, ו-Dialog בדסקטופ. הוספתי זאת באפיון.

**בעיה 6: חסרה אסטרטגיית גיבוי**
- מה קורה אם Supabase נופל? או שהמשתמש מוחק בטעות?
- **שיפור:** הוספתי ב-Settings כפתור "ייצוא גיבוי" שמוריד JSON עם כל הנתונים, ו-"ייבוא גיבוי" שטוען אותם חזרה. פשוט וללא תלות בשירות חיצוני.

**בעיה 7: מחזור תקציבי — ה-11 בחודש**
- ציינתי שהמשכורת ב-11, אבל לא הסברתי איך זה משפיע
- **שיפור:** המחזור התקציבי הוא קלנדרי רגיל (1-31 לכל חודש) כפי שזה בקובץ האקסל. יום ה-11 הוא פשוט התאריך שבו ההכנסה הקבועה (משכורת) נרשמת. זה מפושט ונכון — אין צורך לסבך את המערכת עם "חודש תקציבי" שונה מחודש קלנדרי.

### 11.2 שיפורים שנוספו אחרי הביקורת

1. ✅ הסרת טבלאות Users/Families — פישוט משמעותי
2. ✅ Quick Add (הוספה מהירה) — סכום + קטגוריה בלבד, FAB button
3. ✅ "פרטים נוספים" בטופס — הסתרת שדות לא חובה
4. ✅ גיבוי/שחזור JSON בהגדרות
5. ✅ הנחיית RTL לגרפים ב-Cursor rules
6. ✅ Bottom Sheet למובייל במקום Dialog
7. ✅ Service Worker strategy מפורטת
8. ✅ הבהרת מחזור תקציבי (קלנדרי רגיל)

---

## נספח א': משתני סביבה (.env.local)

```env
# Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# App
NEXT_PUBLIC_APP_NAME="כלכלת הבית"
NEXT_PUBLIC_DEFAULT_PAYDAY=11
```

## נספח ב': פקודות שימושיות

```bash
# פיתוח מקומי
npm run dev

# Prisma — אחרי שינוי סכמה
npx prisma generate
npx prisma db push

# Seed נתוני ברירת מחדל
npx prisma db seed

# Deploy ל-Vercel
npx vercel

# בדיקת PWA
# פתח Chrome DevTools → Application → Manifest / Service Workers
```

## נספח ג': רפרנס ויזואלי

ההשראה העיצובית מבוססת על שילוב של:
- **Riseup** — מסכים נקיים, מספרים גדולים ובולטים, שפה חמה ופשוטה, צבעי פסטל
- **Moneytor** — דשבורד עשיר במידע, גרפים מגוונים, השוואות לממוצעים, כרטיסי סיכום

הגישה: "**פשוט מבחוץ, עשיר מבפנים**" — המסך הראשון פשוט ונקי, אבל כל לחיצה חושפת שכבה נוספת של מידע.

---

*מסמך זה הוא מפת הדרכים המלאה לפיתוח "כלכלת הבית". יש להשתמש בו כ-reference ב-Cursor IDE ולבנות את האפליקציה שלב אחר שלב.*

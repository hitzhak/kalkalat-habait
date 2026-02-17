/**
 * seed-mock.ts — Comprehensive mock data seeder
 * Based on the user's real Excel budget structure ("קובץ מעקב משפחת חן").
 * Creates 3 months of realistic transactions, budgets, savings goals, and loans.
 *
 * Usage: npx tsx prisma/seed-mock.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: week number from day of month (1-7=W1, 8-14=W2, 15-21=W3, 22-28=W4, 29-31=W5)
function weekNumber(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

async function main() {
  console.log('========================================');
  console.log('  Mock Data Seeder');
  console.log('========================================\n');

  // Fetch existing categories
  const allCategories = await prisma.category.findMany({
    include: { children: true },
  });

  if (allCategories.length === 0) {
    console.log('No categories found. Run the base seed first: npx prisma db seed');
    process.exit(1);
  }

  // Build lookup maps
  const catByName = new Map<string, string>();
  for (const cat of allCategories) {
    catByName.set(cat.name, cat.id);
    if (cat.children) {
      for (const child of cat.children) {
        catByName.set(child.name, child.id);
      }
    }
  }

  function findCat(name: string): string {
    const id = catByName.get(name);
    if (!id) {
      console.warn(`  [WARN] Category not found: "${name}" — skipping`);
      return '';
    }
    return id;
  }

  // ========== Clear existing data ==========
  console.log('Clearing existing transactions, budgets, savings, loans...');
  await prisma.loanPayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.savingsDeposit.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.transaction.deleteMany();
  console.log('  Done.\n');

  // ========== MONTHS TO SEED ==========
  const months = [
    { month: 11, year: 2025, label: 'נובמבר 2025' },
    { month: 12, year: 2025, label: 'דצמבר 2025' },
    { month: 1, year: 2026, label: 'ינואר 2026' },
  ];

  // ========== INCOME DATA (from Excel) ==========
  const incomeData: Record<string, { salary1: number; childAllowance: number; business: number; extra?: { name: string; amount: number } }> = {
    '11-2025': { salary1: 17563, childAllowance: 269, business: 6000, extra: { name: 'הכנסה נוספת 1', amount: 1000 } },
    '12-2025': { salary1: 17563, childAllowance: 269, business: 6200, extra: { name: 'הכנסה נוספת 1', amount: 500 } },
    '1-2026': { salary1: 17823, childAllowance: 269, business: 8483 },
  };

  // ========== FIXED EXPENSES DATA (from Excel, date=11th) ==========
  interface FixedExpense { category: string; amount: number }
  const fixedExpensesByMonth: Record<string, FixedExpense[]> = {
    '11-2025': [
      { category: 'סלולר', amount: 193 },
      { category: 'אינטרנט', amount: 105 },
      { category: 'טלוויזיה', amount: 40 },
      { category: 'אחסון ענן', amount: 12 },
      { category: 'סטרימינג', amount: 23 },
      { category: 'חשמל', amount: 672 },
      { category: 'ארנונה', amount: 568 },
      { category: 'מים', amount: 172 },
      { category: 'משכנתא', amount: 4674 },
      { category: 'ועד בית', amount: 225 },
      { category: 'מעון', amount: 2628 },
      { category: 'צהרון', amount: 418 },
      { category: 'סל תרבות', amount: 45 },
      { category: 'חוגים', amount: 200 },
      { category: 'הוצאות גן', amount: 30 },
      { category: 'קופת חולים', amount: 450 },
      { category: 'ביטוח בריאות', amount: 500 },
      { category: 'ביטוח רכב', amount: 410 },
      { category: 'תחבורה ציבורית', amount: 50 },
      { category: 'הלוואות בנק', amount: 1100 },
      { category: 'תרומות', amount: 50 },
      { category: 'מנויים', amount: 99 },
    ],
    '12-2025': [
      { category: 'סלולר', amount: 193 },
      { category: 'אינטרנט', amount: 105 },
      { category: 'טלוויזיה', amount: 40 },
      { category: 'אחסון ענן', amount: 12 },
      { category: 'סטרימינג', amount: 24 },
      { category: 'חשמל', amount: 647 },
      { category: 'ארנונה', amount: 568 },
      { category: 'גז', amount: 14 },
      { category: 'מים', amount: 171 },
      { category: 'משכנתא', amount: 4633 },
      { category: 'ועד בית', amount: 225 },
      { category: 'מעון', amount: 2628 },
      { category: 'צהרון', amount: 418 },
      { category: 'סל תרבות', amount: 45 },
      { category: 'חוגים', amount: 200 },
      { category: 'הוצאות גן', amount: 30 },
      { category: 'קופת חולים', amount: 360 },
      { category: 'ביטוח בריאות', amount: 500 },
      { category: 'ביטוח רכב', amount: 410 },
      { category: 'תחבורה ציבורית', amount: 50 },
      { category: 'הלוואות בנק', amount: 1126 },
      { category: 'תרומות', amount: 50 },
      { category: 'מנויים', amount: 99 },
    ],
    '1-2026': [
      { category: 'סלולר', amount: 193 },
      { category: 'אינטרנט', amount: 105 },
      { category: 'טלוויזיה', amount: 40 },
      { category: 'אחסון ענן', amount: 12 },
      { category: 'סטרימינג', amount: 24 },
      { category: 'חשמל', amount: 312 },
      { category: 'ארנונה', amount: 575 },
      { category: 'גז', amount: 14 },
      { category: 'מים', amount: 171 },
      { category: 'משכנתא', amount: 4676 },
      { category: 'ועד בית', amount: 225 },
      { category: 'מעון', amount: 2628 },
      { category: 'צהרון', amount: 418 },
      { category: 'סל תרבות', amount: 45 },
      { category: 'חוגים', amount: 200 },
      { category: 'הוצאות גן', amount: 30 },
      { category: 'קופת חולים', amount: 360 },
      { category: 'ביטוח בריאות', amount: 500 },
      { category: 'ביטוח רכב', amount: 410 },
      { category: 'תחבורה ציבורית', amount: 50 },
      { category: 'הלוואות בנק', amount: 1144 },
      { category: 'תרומות', amount: 50 },
      { category: 'מנויים', amount: 99 },
    ],
  };

  // ========== VARIABLE EXPENSES DATA (from Excel, spread across weeks) ==========
  interface VariableExpense { category: string; week: number; day: number; amount: number; notes?: string }
  const variableExpensesByMonth: Record<string, VariableExpense[]> = {
    '11-2025': [
      // Food & groceries
      { category: 'מכולת', week: 1, day: 3, amount: 711, notes: 'קניות שבועיות' },
      { category: 'מכולת', week: 2, day: 10, amount: 864, notes: 'קניות שבועיות' },
      { category: 'מכולת', week: 3, day: 17, amount: 464, notes: 'קניות שבועיות' },
      { category: 'מכולת', week: 4, day: 24, amount: 595, notes: 'קניות שבועיות' },
      { category: 'אוכל בחוץ', week: 1, day: 2, amount: 395 },
      { category: 'אוכל בחוץ', week: 2, day: 9, amount: 438 },
      { category: 'אוכל בחוץ', week: 3, day: 15, amount: 332 },
      { category: 'אוכל בחוץ', week: 4, day: 22, amount: 149 },
      { category: 'פארם', week: 1, day: 4, amount: 27 },
      { category: 'פארם', week: 2, day: 12, amount: 226 },
      { category: 'פארם', week: 3, day: 19, amount: 138 },
      { category: 'סיגריות', week: 1, day: 5, amount: 109 },
      { category: 'סיגריות', week: 3, day: 18, amount: 79 },
      { category: 'סיגריות', week: 4, day: 25, amount: 84 },
      // Beauty
      { category: 'טיפולים', week: 1, day: 6, amount: 110 },
      { category: 'טיפולים', week: 2, day: 13, amount: 140 },
      { category: 'טיפולים', week: 3, day: 20, amount: 180 },
      { category: 'מוצרים', week: 3, day: 16, amount: 50 },
      { category: 'מספרה', week: 3, day: 21, amount: 70 },
      // Car
      { category: 'דלק', week: 1, day: 1, amount: 300, notes: 'תדלוק' },
      { category: 'דלק', week: 3, day: 15, amount: 300, notes: 'תדלוק' },
      { category: 'דלק', week: 4, day: 22, amount: 300, notes: 'תדלוק' },
      { category: 'שטיפה', week: 1, day: 7, amount: 30 },
      // Misc
      { category: 'חיות מחמד', week: 1, day: 3, amount: 170 },
      { category: 'ביגוד', week: 1, day: 5, amount: 461 },
      { category: 'ביגוד', week: 2, day: 10, amount: 510 },
      { category: 'ביגוד', week: 3, day: 17, amount: 509 },
      { category: 'ביגוד', week: 4, day: 23, amount: 75 },
      { category: 'מזומן ללא מעקב', week: 1, day: 2, amount: 49 },
      { category: 'מזומן ללא מעקב', week: 3, day: 16, amount: 51 },
      { category: 'קלינאית', week: 1, day: 4, amount: 350 },
      { category: 'קלינאית', week: 2, day: 11, amount: 350 },
      { category: 'קלינאית', week: 3, day: 18, amount: 350 },
      { category: 'קלינאית', week: 4, day: 25, amount: 350 },
      // Entertainment
      { category: 'בילויים', week: 4, day: 26, amount: 140 },
      { category: 'ימי הולדת', week: 1, day: 6, amount: 361 },
      { category: 'צעצועים', week: 2, day: 10, amount: 200 },
      { category: 'צעצועים', week: 4, day: 24, amount: 87 },
      // Home products
      { category: 'מוצרים לבית', week: 1, day: 4, amount: 66, notes: 'מוצרי ניקיון' },
      { category: 'מוצרים לבית', week: 4, day: 23, amount: 220, notes: 'כלי בית' },
    ],
    '12-2025': [
      { category: 'מכולת', week: 3, day: 18, amount: 2885, notes: 'קניות החודש' },
      { category: 'אוכל בחוץ', week: 3, day: 15, amount: 940 },
      { category: 'פארם', week: 3, day: 20, amount: 323 },
      { category: 'סיגריות', week: 3, day: 16, amount: 379 },
      { category: 'טיפולים', week: 4, day: 22, amount: 210 },
      { category: 'מוצרים', week: 4, day: 23, amount: 50 },
      { category: 'מספרה', week: 4, day: 25, amount: 70 },
      { category: 'דלק', week: 3, day: 17, amount: 845, notes: 'תדלוק' },
      { category: 'שטיפה', week: 1, day: 2, amount: 97, notes: 'שטיפה חיצונית ופנימית' },
      { category: 'חיות מחמד', week: 3, day: 19, amount: 41 },
      { category: 'ביגוד', week: 3, day: 18, amount: 1200, notes: 'קניות חורף' },
      { category: 'מזומן ללא מעקב', week: 3, day: 15, amount: 108 },
      { category: 'קלינאית', week: 3, day: 16, amount: 1050 },
      { category: 'בילויים', week: 3, day: 20, amount: 246 },
      { category: 'ימי הולדת', week: 3, day: 17, amount: 100 },
      { category: 'צעצועים', week: 3, day: 19, amount: 200 },
      { category: 'מוצרים לבית', week: 3, day: 21, amount: 482, notes: 'ריהוט' },
      { category: 'חניה', week: 1, day: 5, amount: 35 },
    ],
    '1-2026': [
      { category: 'מכולת', week: 2, day: 12, amount: 2114, notes: 'קניות שבועיות' },
      { category: 'אוכל בחוץ', week: 2, day: 10, amount: 1000 },
      { category: 'פארם', week: 2, day: 13, amount: 154 },
      { category: 'סיגריות', week: 2, day: 11, amount: 167 },
      { category: 'דלק', week: 2, day: 14, amount: 600, notes: 'תדלוק' },
      { category: 'ביגוד', week: 2, day: 9, amount: 840 },
      { category: 'מזומן ללא מעקב', week: 2, day: 10, amount: 410 },
      { category: 'ימי הולדת', week: 2, day: 12, amount: 250, notes: 'יום הולדת' },
      { category: 'צעצועים', week: 2, day: 8, amount: 60 },
    ],
  };

  // ========== BUDGET ITEMS PER MONTH (planned amounts from Excel) ==========
  interface BudgetEntry { category: string; amount: number }
  const budgetByMonth: Record<string, BudgetEntry[]> = {
    '11-2025': [
      { category: 'תקשורת', amount: 373 },
      { category: 'דיור', amount: 6295 },
      { category: 'ילדים וחינוך', amount: 3366 },
      { category: 'ביטוחים', amount: 950 },
      { category: 'תחבורה', amount: 460 },
      { category: 'מימון ובנק', amount: 1100 },
      { category: 'שונות', amount: 2014 },
      { category: 'אוכל וקניות', amount: 4700 },
      { category: 'טיפוח ויופי', amount: 370 },
      { category: 'רכב', amount: 930 },
      { category: 'תרבות ופנאי', amount: 700 },
      { category: 'שונות נוספות', amount: 2500 },
    ],
    '12-2025': [
      { category: 'תקשורת', amount: 618 },
      { category: 'דיור', amount: 6258 },
      { category: 'ילדים וחינוך', amount: 3366 },
      { category: 'ביטוחים', amount: 860 },
      { category: 'תחבורה', amount: 460 },
      { category: 'מימון ובנק', amount: 1126 },
      { category: 'שונות', amount: 1794 },
      { category: 'אוכל וקניות', amount: 4950 },
      { category: 'טיפוח ויופי', amount: 370 },
      { category: 'רכב', amount: 970 },
      { category: 'תרבות ופנאי', amount: 700 },
      { category: 'שונות נוספות', amount: 2500 },
    ],
    '1-2026': [
      { category: 'תקשורת', amount: 637 },
      { category: 'דיור', amount: 6397 },
      { category: 'ילדים וחינוך', amount: 3366 },
      { category: 'ביטוחים', amount: 860 },
      { category: 'תחבורה', amount: 460 },
      { category: 'מימון ובנק', amount: 1144 },
      { category: 'שונות', amount: 1794 },
      { category: 'אוכל וקניות', amount: 5200 },
      { category: 'טיפוח ויופי', amount: 370 },
      { category: 'רכב', amount: 970 },
      { category: 'תרבות ופנאי', amount: 700 },
      { category: 'שונות נוספות', amount: 2500 },
    ],
  };

  // ========== CREATE TRANSACTIONS & BUDGET ITEMS ==========
  let totalTransactions = 0;
  let totalBudgetItems = 0;

  for (const { month, year, label } of months) {
    const key = `${month}-${year}`;
    console.log(`\nCreating data for ${label}...`);

    // --- Income ---
    const income = incomeData[key];
    if (income) {
      const salaryId = findCat('משכורת 1');
      const childId = findCat('קצבת ילדים');
      const businessId = findCat('עסק / פרילנס');

      if (salaryId) {
        await prisma.transaction.create({
          data: {
            amount: income.salary1,
            type: 'INCOME',
            categoryId: salaryId,
            date: new Date(year, month - 1, 5),
            isFixed: true,
            isRecurring: true,
            notes: 'משכורת חודשית',
          },
        });
        totalTransactions++;
      }

      if (childId) {
        await prisma.transaction.create({
          data: {
            amount: income.childAllowance,
            type: 'INCOME',
            categoryId: childId,
            date: new Date(year, month - 1, 3),
            isFixed: true,
            isRecurring: true,
            notes: 'קצבת ילדים מביטוח לאומי',
          },
        });
        totalTransactions++;
      }

      if (businessId) {
        await prisma.transaction.create({
          data: {
            amount: income.business,
            type: 'INCOME',
            categoryId: businessId,
            date: new Date(year, month - 1, 8),
            isFixed: false,
            isRecurring: false,
            notes: 'הכנסה מעסק',
          },
        });
        totalTransactions++;
      }

      if (income.extra) {
        const extraId = findCat(income.extra.name);
        if (extraId) {
          await prisma.transaction.create({
            data: {
              amount: income.extra.amount,
              type: 'INCOME',
              categoryId: extraId,
              date: new Date(year, month - 1, 7),
              isFixed: false,
              isRecurring: false,
              notes: 'הכנסה חד-פעמית',
            },
          });
          totalTransactions++;
        }
      }
    }

    // --- Fixed Expenses ---
    const fixedExpenses = fixedExpensesByMonth[key] || [];
    for (const exp of fixedExpenses) {
      const catId = findCat(exp.category);
      if (!catId) continue;
      await prisma.transaction.create({
        data: {
          amount: exp.amount,
          type: 'EXPENSE',
          categoryId: catId,
          date: new Date(year, month - 1, 11),
          weekNumber: null,
          isFixed: true,
          isRecurring: true,
        },
      });
      totalTransactions++;
    }

    // --- Variable Expenses ---
    const variableExpenses = variableExpensesByMonth[key] || [];
    for (const exp of variableExpenses) {
      const catId = findCat(exp.category);
      if (!catId) continue;
      await prisma.transaction.create({
        data: {
          amount: exp.amount,
          type: 'EXPENSE',
          categoryId: catId,
          date: new Date(year, month - 1, exp.day),
          weekNumber: weekNumber(exp.day),
          isFixed: false,
          isRecurring: false,
          notes: exp.notes || null,
        },
      });
      totalTransactions++;
    }

    // --- Budget Items ---
    const budgetEntries = budgetByMonth[key] || [];
    for (const entry of budgetEntries) {
      const catId = findCat(entry.category);
      if (!catId) continue;
      await prisma.budgetItem.create({
        data: {
          categoryId: catId,
          month,
          year,
          plannedAmount: entry.amount,
        },
      });
      totalBudgetItems++;
    }

    console.log(`  Income: ${income ? '3-4' : '0'} | Fixed: ${fixedExpenses.length} | Variable: ${variableExpenses.length} | Budget: ${budgetEntries.length}`);
  }

  // ========== SAVINGS GOALS ==========
  console.log('\nCreating savings goals...');

  const vacation = await prisma.savingsGoal.create({
    data: {
      name: 'חופשה משפחתית',
      icon: 'Plane',
      targetAmount: 15000,
      currentAmount: 8500,
      targetDate: new Date(2026, 7, 1),
      monthlyTarget: 600,
      color: '#06B6D4',
    },
  });

  const emergency = await prisma.savingsGoal.create({
    data: {
      name: 'קרן חירום',
      icon: 'Shield',
      targetAmount: 50000,
      currentAmount: 22000,
      targetDate: null,
      monthlyTarget: 1500,
      color: '#10B981',
    },
  });

  // Deposits for savings
  const depositData = [
    { goalId: vacation.id, amount: 600, date: new Date(2025, 10, 15), notes: 'הפקדה חודשית' },
    { goalId: vacation.id, amount: 600, date: new Date(2025, 11, 15), notes: 'הפקדה חודשית' },
    { goalId: vacation.id, amount: 600, date: new Date(2026, 0, 15), notes: 'הפקדה חודשית' },
    { goalId: emergency.id, amount: 1500, date: new Date(2025, 10, 20), notes: 'הפקדה חודשית' },
    { goalId: emergency.id, amount: 1500, date: new Date(2025, 11, 20), notes: 'הפקדה חודשית' },
    { goalId: emergency.id, amount: 1500, date: new Date(2026, 0, 20), notes: 'הפקדה חודשית' },
  ];

  for (const dep of depositData) {
    await prisma.savingsDeposit.create({ data: dep });
  }

  console.log('  2 savings goals + 6 deposits');

  // ========== LOANS ==========
  console.log('\nCreating loans...');

  const mortgage = await prisma.loan.create({
    data: {
      name: 'משכנתא',
      type: 'MORTGAGE',
      originalAmount: 800000,
      remainingAmount: 648000,
      monthlyPayment: 4660,
      interestRate: 3.2,
      startDate: new Date(2020, 0, 1),
      endDate: new Date(2045, 0, 1),
      totalPayments: 300,
      remainingPayments: 228,
      isActive: true,
    },
  });

  const bankLoan = await prisma.loan.create({
    data: {
      name: 'הלוואת בנק',
      type: 'BANK',
      originalAmount: 30000,
      remainingAmount: 18000,
      monthlyPayment: 1120,
      interestRate: 5.5,
      startDate: new Date(2024, 5, 1),
      endDate: new Date(2027, 5, 1),
      totalPayments: 36,
      remainingPayments: 17,
      isActive: true,
    },
  });

  // Loan payments (3 months each)
  const loanPayments = [
    { loanId: mortgage.id, amount: 4674, principalAmount: 2500, interestAmount: 2174, date: new Date(2025, 10, 11) },
    { loanId: mortgage.id, amount: 4633, principalAmount: 2480, interestAmount: 2153, date: new Date(2025, 11, 11) },
    { loanId: mortgage.id, amount: 4676, principalAmount: 2520, interestAmount: 2156, date: new Date(2026, 0, 11) },
    { loanId: bankLoan.id, amount: 1100, principalAmount: 960, interestAmount: 140, date: new Date(2025, 10, 11) },
    { loanId: bankLoan.id, amount: 1126, principalAmount: 990, interestAmount: 136, date: new Date(2025, 11, 11) },
    { loanId: bankLoan.id, amount: 1144, principalAmount: 1010, interestAmount: 134, date: new Date(2026, 0, 11) },
  ];

  for (const payment of loanPayments) {
    await prisma.loanPayment.create({ data: payment });
  }

  console.log('  2 loans + 6 payments');

  // ========== SUMMARY ==========
  console.log('\n========================================');
  console.log('  Mock Data Seeding Complete!');
  console.log('========================================');
  console.log(`  Transactions: ${totalTransactions}`);
  console.log(`  Budget Items: ${totalBudgetItems}`);
  console.log('  Savings Goals: 2 (+ 6 deposits)');
  console.log('  Loans: 2 (+ 6 payments)');
  console.log('  Months covered: Nov 2025, Dec 2025, Jan 2026');
  console.log('========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error in seed-mock:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { getBudgetPageData } from '@/app/actions/budgets';
import { BudgetContent } from '@/components/budget/BudgetContent';
import { getMonthYearFromParams } from '@/lib/monthYear';

interface PageProps {
  searchParams: { month?: string; year?: string };
}

export default async function BudgetPage({ searchParams }: PageProps) {
  const { month, year } = getMonthYearFromParams(searchParams);

  let budgetData: unknown[] = [];
  let summaryData = null;

  try {
    const result = await getBudgetPageData(month, year);
    budgetData = result.budget;
    summaryData = result.summaryData;
  } catch (error) {
    console.error('Error loading budget:', error);
  }

  return (
    <BudgetContent
      initialBudgetData={budgetData}
      initialSummary={summaryData}
      month={month}
      year={year}
    />
  );
}

import { getTransactionsPageData } from '@/app/actions/transactions';
import { TransactionsContent } from '@/components/transactions/TransactionsContent';
import { getMonthYearFromParams } from '@/lib/monthYear';

interface PageProps {
  searchParams: { month?: string; year?: string };
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const { month, year } = getMonthYearFromParams(searchParams);

  let transactions: unknown[] = [];
  let summary = null;

  try {
    const data = await getTransactionsPageData(month, year);
    transactions = data.transactionsResult.transactions || [];
    summary = data.summary;
  } catch (error) {
    console.error('Error loading transactions:', error);
  }

  return (
    <TransactionsContent
      initialTransactions={transactions}
      initialSummary={summary}
      month={month}
      year={year}
    />
  );
}

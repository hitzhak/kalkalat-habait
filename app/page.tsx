import { getDashboardData } from './actions/dashboard';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { getMonthYearFromParams } from '@/lib/monthYear';

interface PageProps {
  searchParams: { month?: string; year?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { month, year } = getMonthYearFromParams(searchParams);

  let dashboardData = null;
  let error = false;

  try {
    dashboardData = await getDashboardData(month, year);
  } catch {
    error = true;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <DashboardContent
        data={dashboardData}
        error={error}
        month={month}
        year={year}
      />
    </div>
  );
}

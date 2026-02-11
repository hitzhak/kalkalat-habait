import { useAppStore } from '@/stores/appStore';
import { getMonthName } from '@/lib/formatters';

export function useMonthNavigation() {
  const {
    selectedMonth,
    selectedYear,
    goToNextMonth,
    goToPrevMonth,
    goToCurrentMonth,
  } = useAppStore();

  const monthName = getMonthName(selectedMonth);
  const monthYearDisplay = `${monthName} ${selectedYear}`;

  return {
    selectedMonth,
    selectedYear,
    monthName,
    monthYearDisplay,
    goToNextMonth,
    goToPrevMonth,
    goToCurrentMonth,
  };
}

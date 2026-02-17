'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { getMonthName } from '@/lib/formatters';

export function useMonthNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const now = new Date();
  const selectedMonth = Number(searchParams.get('month')) || (now.getMonth() + 1);
  const selectedYear = Number(searchParams.get('year')) || now.getFullYear();

  const monthName = getMonthName(selectedMonth);
  const monthYearDisplay = `${monthName} ${selectedYear}`;

  const navigateToMonth = useCallback((month: number, year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month.toString());
    params.set('year', year.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [router, searchParams, pathname]);

  const goToNextMonth = useCallback(() => {
    if (selectedMonth === 12) {
      navigateToMonth(1, selectedYear + 1);
    } else {
      navigateToMonth(selectedMonth + 1, selectedYear);
    }
  }, [selectedMonth, selectedYear, navigateToMonth]);

  const goToPrevMonth = useCallback(() => {
    if (selectedMonth === 1) {
      navigateToMonth(12, selectedYear - 1);
    } else {
      navigateToMonth(selectedMonth - 1, selectedYear);
    }
  }, [selectedMonth, selectedYear, navigateToMonth]);

  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    navigateToMonth(now.getMonth() + 1, now.getFullYear());
  }, [navigateToMonth]);

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

// For server-side usage, import getMonthYearFromParams from '@/lib/monthYear'

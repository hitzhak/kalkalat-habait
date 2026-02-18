'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { getMonthName } from '@/lib/formatters';
import { useAppStore } from '@/stores/appStore';

export function useMonthNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const storeMonth = useAppStore((s) => s.selectedMonth);
  const storeYear = useAppStore((s) => s.selectedYear);
  const setMonth = useAppStore((s) => s.setMonth);

  const urlMonth = searchParams.get('month') ? Number(searchParams.get('month')) : null;
  const urlYear = searchParams.get('year') ? Number(searchParams.get('year')) : null;

  const selectedMonth = urlMonth || storeMonth;
  const selectedYear = urlYear || storeYear;

  useEffect(() => {
    if (urlMonth && urlYear) {
      setMonth(urlMonth, urlYear);
    }
  }, [urlMonth, urlYear, setMonth]);

  const monthName = getMonthName(selectedMonth);
  const monthYearDisplay = `${monthName} ${selectedYear}`;

  const navigateToMonth = useCallback((month: number, year: number) => {
    setMonth(month, year);
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month.toString());
    params.set('year', year.toString());
    router.push(`${pathname}?${params.toString()}`);
  }, [router, searchParams, pathname, setMonth]);

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

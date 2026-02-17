'use client';

import { Suspense } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { Button } from '@/components/ui/button';

function HeaderContent() {
  const { monthYearDisplay, goToNextMonth, goToPrevMonth } = useMonthNavigation();

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
        <ChevronRight className="h-5 w-5" />
      </Button>
      <div className="min-w-[180px] text-center">
        <h2 className="text-lg font-semibold text-slate-800">{monthYearDisplay}</h2>
      </div>
      <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
        <ChevronLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <Suspense fallback={<div className="h-14" />}>
        <HeaderContent />
      </Suspense>
    </header>
  );
}

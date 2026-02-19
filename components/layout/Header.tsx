'use client';

import { Suspense } from 'react';
import { ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function HeaderContent() {
  const { monthYearDisplay, goToNextMonth, goToPrevMonth } = useMonthNavigation();

  return (
    <div className="flex items-center justify-between px-4 py-[1.125rem]">
      <Link href="/guide" className="md:hidden">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary-500">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </Link>
      <div className="flex items-center justify-center gap-4 flex-1">
        <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div className="min-w-[180px] text-center">
          <h2 className="text-lg font-semibold text-foreground">{monthYearDisplay}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="w-8 md:hidden" />
    </div>
  );
}

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <Suspense fallback={<div className="h-[3.75rem]" />}>
        <HeaderContent />
      </Suspense>
    </header>
  );
}

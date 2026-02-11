'use client';

import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useMonthNavigation } from '@/hooks/useMonthNavigation';
import { Button } from '@/components/ui/button';

export function Header() {
  const { monthYearDisplay, goToNextMonth, goToPrevMonth } = useMonthNavigation();

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex items-center justify-center gap-4 p-4">
        {/* חץ ימינה (חודש הבא) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* תצוגת חודש ושנה */}
        <div className="min-w-[180px] text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            {monthYearDisplay}
          </h2>
        </div>

        {/* חץ שמאלה (חודש קודם) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

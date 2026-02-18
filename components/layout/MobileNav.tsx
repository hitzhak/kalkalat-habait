'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

const navItems = [
  { href: '/', label: 'ראשי', icon: Home },
  { href: '/transactions', label: 'עסקאות', icon: Receipt },
  { href: '/reports', label: 'דוחות', icon: BarChart3 },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const selectedYear = useAppStore((s) => s.selectedYear);

  function buildHref(base: string) {
    return `${base}?month=${selectedMonth}&year=${selectedYear}`;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm shadow-lg md:hidden">
      <div className="grid h-14 grid-cols-4 items-center pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all duration-200',
                isActive ? 'text-cyan-600' : 'text-slate-400 active:text-slate-600'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-cyan-600')} />
              <span className={cn(
                'text-[10px] leading-tight',
                isActive ? 'font-bold text-cyan-600' : 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

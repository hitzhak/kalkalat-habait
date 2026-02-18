'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/', label: 'ראשי', icon: Home },
  { href: '/transactions', label: 'עסקאות', icon: Receipt },
  { href: '/reports', label: 'דוחות', icon: BarChart3 },
];

const bottomNavItem = {
  href: '/settings',
  label: 'הגדרות',
  icon: Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const selectedYear = useAppStore((s) => s.selectedYear);

  function buildHref(base: string) {
    return `${base}?month=${selectedMonth}&year=${selectedYear}`;
  }

  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-60 flex-col border-l bg-white shadow-sm md:flex">
      <Link href={buildHref('/')} className="flex items-center gap-2 border-b p-6 hover:bg-slate-50 transition-colors">
        <Wallet className="h-6 w-6 text-cyan-600" />
        <h1 className="text-xl font-bold text-slate-800">כלכלת הבית</h1>
      </Link>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-cyan-50 text-cyan-600 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-1">
        <Link
          href={buildHref(bottomNavItem.href)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
            pathname === bottomNavItem.href
              ? 'bg-cyan-50 text-cyan-600 shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]'
          )}
        >
          <bottomNavItem.icon className="h-5 w-5" />
          <span>{bottomNavItem.label}</span>
        </Link>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>התנתק</span>
        </button>
      </div>
    </aside>
  );
}

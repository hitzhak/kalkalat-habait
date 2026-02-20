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
  BookOpen,
  Users,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/', label: 'ראשי', icon: Home },
  { href: '/transactions', label: 'עסקאות', icon: Receipt },
  { href: '/reports', label: 'דוחות', icon: BarChart3 },
  { href: '/savings', label: 'חיסכון', icon: Target },
  { href: '/family', label: 'משפחה', icon: Users },
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

  function buildHref(base: string, withMonth = true) {
    if (!withMonth || base === '/savings') return base;
    return `${base}?month=${selectedMonth}&year=${selectedYear}`;
  }

  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-60 flex-col border-l bg-white shadow-sm md:flex">
      <Link href={buildHref('/')} className="flex items-center gap-2 border-b p-6 hover:bg-secondary transition-colors">
        <Wallet className="h-6 w-6 text-primary-500" />
        <h1 className="text-xl font-bold text-foreground">כלכלת הבית</h1>
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
                  ? 'bg-primary-50 text-primary-500 shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.98]'
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
          href="/guide"
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
            pathname === '/guide'
              ? 'bg-primary-50 text-primary-500 shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.98]'
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span>מדריך</span>
        </Link>
        <Link
          href={buildHref(bottomNavItem.href)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
            pathname === bottomNavItem.href
              ? 'bg-primary-50 text-primary-500 shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.98]'
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
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-expense-50 hover:text-expense-500 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>התנתק</span>
        </button>
      </div>
    </aside>
  );
}

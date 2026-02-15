'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, LayoutList, Target, Landmark, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'דשבורד', icon: Home },
  { href: '/transactions', label: 'עסקאות', icon: Receipt },
  { href: '/budget', label: 'תקציב', icon: LayoutList },
  { href: '/savings', label: 'חיסכון', icon: Target },
  { href: '/loans', label: 'הלוואות', icon: Landmark },
  { href: '/reports', label: 'דוחות', icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg md:hidden">
      <div className="grid h-16 grid-cols-6 items-center pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-w-0',
                isActive ? 'text-cyan-600' : 'text-slate-500'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'fill-current')} />
              <span className="text-[9px] font-medium leading-tight truncate max-w-full px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

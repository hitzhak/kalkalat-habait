'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Wallet,
  Receipt,
  LayoutList,
  Target,
  Landmark,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'דשבורד', icon: Home },
  { href: '/transactions', label: 'הכנסות והוצאות', icon: Receipt },
  { href: '/budget', label: 'תקציב', icon: LayoutList },
  { href: '/savings', label: 'מטרות חיסכון', icon: Target },
  { href: '/loans', label: 'הלוואות וחובות', icon: Landmark },
  { href: '/reports', label: 'דוחות', icon: BarChart3 },
];

const bottomNavItem = {
  href: '/settings',
  label: 'הגדרות',
  icon: Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-40 hidden h-screen w-60 flex-col border-l bg-white shadow-sm md:flex">
      {/* לוגו */}
      <div className="flex items-center gap-2 border-b p-6">
        <Wallet className="h-6 w-6 text-cyan-600" />
        <h1 className="text-xl font-bold text-slate-800">כלכלת הבית</h1>
      </div>

      {/* ניווט ראשי */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-cyan-50 text-cyan-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* הגדרות בתחתית */}
      <div className="border-t p-4">
        <Link
          href={bottomNavItem.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
            pathname === bottomNavItem.href
              ? 'bg-cyan-50 text-cyan-600'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <bottomNavItem.icon className="h-5 w-5" />
          <span>{bottomNavItem.label}</span>
        </Link>
      </div>
    </aside>
  );
}

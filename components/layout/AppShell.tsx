'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAddButton } from '@/components/layout/QuickAddButton';
import { NavigationProgress } from '@/components/layout/NavigationProgress';
import { PageTransition } from '@/components/layout/PageTransition';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <NavigationProgress />
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-1 flex-col md:mr-60">
          <Header />
          <main className="flex-1 pb-20 md:pb-6 overflow-x-hidden">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
      <MobileNav />
      <QuickAddButton />
    </>
  );
}

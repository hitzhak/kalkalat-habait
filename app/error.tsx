'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  const isDbError =
    error?.message?.includes('Tenant or user not found') ||
    error?.message?.includes('database') ||
    error?.message?.includes('Prisma') ||
    error?.digest;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6" dir="rtl">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50/80 p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">אירעה שגיאה</h2>
        <p className="text-muted-foreground">
          {isDbError
            ? 'לא ניתן להתחבר למסד הנתונים. ייתכן שמשתני הסביבה (DATABASE_URL / DIRECT_URL) ב-Vercel לא מוגדרים או שהפרויקט ב-Supabase מושהה.'
            : 'משהו השתבש. נסה לרענן את הדף או לחזור לדף הבית.'}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => reset()} variant="default">
            נסה שוב
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline">
            דף הבית
          </Button>
        </div>
      </div>
    </div>
  );
}

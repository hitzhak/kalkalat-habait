import Link from 'next/link';

export function DbConnectionError() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-2">לא ניתן להתחבר למסד הנתונים</h2>
        <p className="text-muted-foreground text-sm mb-4">
          בדוק ש-DATABASE_URL ו-DIRECT_URL מוגדרים נכון ב-Vercel (project ref: lxvcjdgbgyxibxxdsbkt) והפרויקט ב-Supabase לא מושהה.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}

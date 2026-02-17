import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* כותרת */}
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-56 mt-2" />
      </div>

      {/* הגדרות כלליות */}
      <Skeleton className="h-48 rounded-xl" />

      {/* ניהול קטגוריות */}
      <Skeleton className="h-64 rounded-xl" />

      {/* גיבוי ושחזור */}
      <Skeleton className="h-40 rounded-xl" />

      {/* אודות */}
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}

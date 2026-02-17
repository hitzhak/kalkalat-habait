import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading UI עבור דף הדשבורד (/) - מוצג מיד במעבר בין דפים.
 * משפר את חוויית המשתמש על ידי מתן פידבק ויזואלי מיידי.
 */
export default function RootLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* כותרת */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* פס התקדמות תקציב */}
      <Skeleton className="h-48 rounded-xl" />

      {/* גרפים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      {/* עסקאות אחרונות */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

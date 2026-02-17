import { Skeleton } from '@/components/ui/skeleton';

export default function SavingsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Summary */}
      <Skeleton className="h-24 rounded-xl" />

      {/* Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

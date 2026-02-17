import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-52 mt-2" />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* Remaining budget hero */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Recent transactions */}
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

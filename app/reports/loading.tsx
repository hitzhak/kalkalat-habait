import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <Skeleton className="h-8 w-28" />

      {/* Tabs */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Charts area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>

      {/* Table area */}
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

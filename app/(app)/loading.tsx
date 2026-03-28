import { Skeleton } from "@/components/ui/skeleton";

export default function AppSegmentLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-[220px] rounded-[1.75rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[140px] rounded-[1.5rem]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="space-y-6">
          <Skeleton className="h-[320px] rounded-[1.5rem]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px] rounded-[1.5rem]" />
            <Skeleton className="h-[300px] rounded-[1.5rem]" />
          </div>
        </div>
        <Skeleton className="h-[760px] rounded-[1.5rem]" />
      </div>
    </div>
  );
}

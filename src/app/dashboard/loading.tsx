import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Yüklənir">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-52 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}

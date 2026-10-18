import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Dərs yüklənir">
      <div className="h-14 border-b border-line" />
      <div className="mx-auto grid max-w-[720px] gap-4 px-4 pt-12">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="mt-6 h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

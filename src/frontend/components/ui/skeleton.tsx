import type { HTMLAttributes } from "react";
import { cn } from "@/frontend/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-gradient-to-r from-slate-200/80 via-slate-100/90 to-slate-200/80 bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

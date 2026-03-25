import { cn } from "@/frontend/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "success" | "warning" | "muted" | "purple" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-blue-100 text-blue-800",
        variant === "success" && "bg-emerald-100 text-emerald-800",
        variant === "warning" && "bg-amber-100 text-amber-900",
        variant === "muted" && "bg-slate-100 text-slate-700",
        variant === "purple" && "bg-violet-100 text-violet-800",
        className
      )}
      {...props}
    />
  );
}

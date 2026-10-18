import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon, title, description, action, className,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-14 text-center", className)}>
      {icon && <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">{icon}</div>}
      <div className="max-w-sm">
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

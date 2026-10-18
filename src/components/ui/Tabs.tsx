"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Item { value: string; label: string; icon?: ReactNode; count?: number }

/** Segmented control. Content switching is done by the caller. */
export function Tabs({
  value, onValueChange, items, className, label,
}: { value: string; onValueChange: (v: string) => void; items: Item[]; className?: string; label?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-2 p-1", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors",
              active ? "bg-surface text-ink shadow-pop" : "text-muted hover:text-ink"
            )}
          >
            {item.icon}
            {item.label}
            {item.count != null && (
              <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-iris-soft text-iris-ink" : "bg-surface-3")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

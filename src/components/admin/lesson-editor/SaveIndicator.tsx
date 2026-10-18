"use client";

import { AlertCircle, Check, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type IndicatorState = "idle" | "pending" | "saving" | "saved" | "error" | "invalid";

const MAP: Record<Exclude<IndicatorState, "idle">, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Saxlanılır…", className: "text-muted", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> },
  saving: { label: "Saxlanılır…", className: "text-muted", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> },
  saved: { label: "Saxlanıldı", className: "text-pass", icon: <Check className="h-3.5 w-3.5" aria-hidden /> },
  error: { label: "Xəta", className: "text-bug", icon: <CloudOff className="h-3.5 w-3.5" aria-hidden /> },
  invalid: { label: "Düzəliş lazımdır", className: "text-xp", icon: <AlertCircle className="h-3.5 w-3.5" aria-hidden /> },
};

export function SaveIndicator({ state, className, labels }: { state: IndicatorState; className?: string; labels?: Partial<Record<IndicatorState, string>> }) {
  if (state === "idle") return <span className={cn("sr-only", className)} aria-live="polite" />;
  const m = MAP[state];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-medium", m.className, className)} aria-live="polite">
      {m.icon}
      {labels?.[state] ?? m.label}
    </span>
  );
}

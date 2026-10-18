import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "iris" | "pass" | "bug" | "xp" | "sky" | "flame";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  iris: "bg-iris-soft text-iris-ink",
  pass: "bg-pass-soft text-pass",
  bug: "bg-bug-soft text-bug",
  xp: "bg-xp-soft text-xp",
  sky: "bg-sky-soft text-sky",
  flame: "bg-flame-soft text-flame",
};

// Legacy colour names used by older admin screens.
const legacy: Record<string, BadgeTone> = {
  gray: "neutral", blue: "iris", green: "pass", red: "bug", yellow: "xp", purple: "iris", cyan: "sky", orange: "flame",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  color?: string;
}

export function Badge({ tone, color, className, ...props }: BadgeProps) {
  const t = tone ?? (color ? legacy[color] ?? "neutral" : "neutral");
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", toneClass[t], className)}
      {...props}
    />
  );
}

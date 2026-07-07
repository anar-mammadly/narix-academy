import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "blue" | "green" | "yellow" | "red" | "gray" | "cyan" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ color = "gray", className, ...props }: BadgeProps) {
  return <span className={cn(`badge-${color}`, className)} {...props} />;
}

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({ value, className, trackClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("progress-bar", trackClassName)}>
      <div className={cn("progress-fill", className)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

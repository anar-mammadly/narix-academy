import { cn } from "@/lib/utils";

type Tone = "iris" | "pass" | "xp" | "flame" | "sky";
const barTone: Record<Tone, string> = {
  iris: "bg-iris", pass: "bg-pass-bright", xp: "bg-xp-bright", flame: "bg-flame-bright", sky: "bg-sky-bright",
};
const strokeTone: Record<Tone, string> = {
  iris: "stroke-iris", pass: "stroke-pass-bright", xp: "stroke-xp-bright", flame: "stroke-flame-bright", sky: "stroke-sky-bright",
};

export function ProgressBar({
  value, tone = "iris", size = "md", label, className,
}: { value: number; tone?: Tone; size?: "sm" | "md" | "lg"; label?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-surface-3", size === "sm" ? "h-1.5" : size === "lg" ? "h-3.5" : "h-2.5", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", barTone[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({
  value, size = 64, stroke = 7, tone = "iris", children, label, className,
}: { value: number; size?: number; stroke?: number; tone?: Tone; children?: React.ReactNode; label?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", strokeTone[tone])}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

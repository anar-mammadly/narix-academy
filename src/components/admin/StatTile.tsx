import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "iris" | "pass" | "bug" | "xp" | "sky" | "flame";

const tile: Record<Tone, string> = {
  iris: "bg-iris-soft text-iris-ink", pass: "bg-pass-soft text-pass", bug: "bg-bug-soft text-bug",
  xp: "bg-xp-soft text-xp", sky: "bg-sky-soft text-sky", flame: "bg-flame-soft text-flame",
};

/** KPI tile: label, value, optional context line. The icon carries the colour, text stays in ink tokens. */
export function StatTile({
  label, value, hint, icon: Icon, tone, href, alert,
}: { label: string; value: string | number; hint?: string; icon: LucideIcon; tone: Tone; href?: string; alert?: boolean }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span aria-hidden className={cn("grid h-10 w-10 place-items-center rounded-lg", tile[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        {href && <ArrowUpRight aria-hidden className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
      <div className="mt-3">
        <p className="text-sm text-ink-2">{label}</p>
        <p className="mt-0.5 flex items-center gap-2 text-2xl font-semibold text-ink sm:text-3xl">
          {value}
          {alert && <span className="h-2 w-2 rounded-full bg-flame-bright" aria-label="diqqət tələb edir" />}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
    </>
  );
  const cls = "group block rounded-xl border border-line bg-surface p-4 sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-iris/40 hover:shadow-lift")}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

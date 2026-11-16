import { cn } from "@/lib/utils";

/**
 * The Narix logo with "academy" set beside it.
 * The logo files come from the Narix brand kit (public/brand); the dark theme
 * uses the version with a white wordmark. `compact` shows the symbol alone.
 */
export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/narix-symbol.png" alt="Narix Academy" width={40} height={22} className="h-[22px] w-auto" />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/narix-logo.png" alt="Narix" width={90} height={20} className="h-5 w-auto shrink-0 dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/narix-logo-light.png" alt="" aria-hidden width={90} height={20} className="hidden h-5 w-auto shrink-0 dark:block" />
      <span className="border-l border-line-strong pl-1.5 font-display text-sm font-medium leading-none tracking-tight text-muted">academy</span>
    </span>
  );
}

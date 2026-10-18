import { cn } from "@/lib/utils";

/** Mark: a test-run tick inside the N tile — the platform is about things passing. */
export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden className="shrink-0">
        <rect width="32" height="32" rx="9" fill="var(--c-iris)" />
        <path d="M9 22V10l8.5 12V10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="23.5" cy="21.5" r="4.5" fill="var(--c-pass-bright)" stroke="var(--c-iris)" strokeWidth="1.5" />
        <path d="M21.6 21.6l1.3 1.3 2.3-2.5" fill="none" stroke="#06281c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span className="whitespace-nowrap font-display text-[0.95rem] font-semibold tracking-tight text-ink">
          Narix<span className="text-muted"> Academy</span>
        </span>
      )}
    </span>
  );
}

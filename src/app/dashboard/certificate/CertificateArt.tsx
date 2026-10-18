import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

/**
 * A certificate is paper: it stays light in dark mode and in print. These are the light
 * token values re-declared locally, so the semantic classes below keep working.
 */
export const PAPER_CSS = `
.narix-paper {
  --c-surface: #ffffff; --c-surface-2: #eef0f8; --c-surface-3: #e3e6f3;
  --c-line: #e1e4f0; --c-line-strong: #c9cee2;
  --c-ink: #14152b; --c-ink-2: #43465f; --c-muted: #6a6e88;
  --c-iris: #5b4bff; --c-iris-soft: #ecebff; --c-iris-ink: #3a2ccc;
  --c-pass: #0faa78; --c-pass-bright: #12c48b; --c-pass-soft: #e2f8ef;
  --c-xp: #b86e00; --c-xp-bright: #ffb547; --c-xp-soft: #fff3dc;
  color: var(--c-ink);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
`;

export type CertificateArtProps = {
  name: string;
  course: string;
  date: string;
  code: string;
  verifyUrl: string;
  className?: string;
};

/** A4-landscape certificate. All sizes are in container units so it scales from phone to paper. */
export function CertificateArt({ name, course, date, code, verifyUrl, className }: CertificateArtProps) {
  return (
    <div className={cn("narix-paper @container w-full", className)}>
      <div
        className="relative aspect-[297/210] w-full overflow-hidden bg-surface"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 0%, color-mix(in oklab, var(--c-iris) 10%, transparent) 0, transparent 38%), radial-gradient(circle at 100% 100%, color-mix(in oklab, var(--c-pass-bright) 12%, transparent) 0, transparent 40%)",
        }}
      >
        {/* Frame */}
        <div className="absolute inset-[2.2cqw] rounded-[1.2cqw] border-[0.35cqw] border-iris" aria-hidden />
        <div className="absolute inset-[3.1cqw] rounded-[0.8cqw] border-[0.12cqw] border-iris/40" aria-hidden />

        <div className="absolute inset-[5.5cqw] flex flex-col items-center text-center">
          <div className="flex w-full items-start justify-between">
            <Logo className="gap-[1cqw] [&>span]:text-[1.7cqw] [&_svg]:h-[3.6cqw] [&_svg]:w-[3.6cqw]" />
            <span className="font-mono text-[1.15cqw] text-muted">№ {code}</span>
          </div>

          <p className="mt-[3.2cqw] font-display text-[1.5cqw] font-semibold uppercase tracking-[0.5em] text-iris">Sertifikat</p>
          <p className="mt-[0.8cqw] text-[1.45cqw] text-ink-2">Bu sənəd təsdiq edir ki,</p>

          <p className="mt-[1.6cqw] max-w-[85%] break-words font-display text-[4.6cqw] font-semibold leading-[1.1] text-ink">{name}</p>
          <div className="mt-[1.4cqw] h-[0.25cqw] w-[30cqw] rounded-full bg-gradient-to-r from-transparent via-iris to-transparent" aria-hidden />

          <p className="mt-[1.8cqw] max-w-[70%] text-[1.6cqw] leading-snug text-ink-2">
            Narix Academy-nin <strong className="font-semibold text-ink">“{course}”</strong> kursunu uğurla tamamlamışdır.
          </p>

          <div className="mt-auto flex w-full items-end justify-between gap-[2cqw]">
            <div className="text-left">
              <p className="text-[1.1cqw] uppercase tracking-wider text-muted">Verilmə tarixi</p>
              <p className="mt-[0.3cqw] font-display text-[1.6cqw] font-semibold text-ink">{date}</p>
            </div>

            {/* Seal */}
            <div className="grid h-[11cqw] w-[11cqw] shrink-0 place-items-center rounded-full bg-xp-soft p-[0.6cqw]" aria-hidden>
              <div className="grid h-full w-full place-items-center rounded-full border-[0.3cqw] border-dashed border-xp-bright">
                <svg viewBox="0 0 24 24" className="h-[4.5cqw] w-[4.5cqw]" fill="none" stroke="var(--c-xp)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.2 4.2L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[1.1cqw] uppercase tracking-wider text-muted">Yoxlama</p>
              <p className="mt-[0.3cqw] break-all font-mono text-[1.1cqw] text-ink-2">{verifyUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

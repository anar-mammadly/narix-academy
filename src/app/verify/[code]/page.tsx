import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/layout/Logo";
import { COURSE_TITLE } from "@/app/api/certificate/eligibility";
import { formatAzDate } from "@/app/dashboard/calendar/az-date";

export const metadata: Metadata = {
  title: "Sertifikat yoxlaması",
  robots: { index: false, follow: false },
};

const CODE_RE = /^[a-z0-9]{8,64}$/i;

/** Public check of a certificate code. Shows only validity, name and date — nothing else. */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = raw.trim();
  const cert = CODE_RE.test(code)
    ? await prisma.certificate.findUnique({ where: { code }, select: { issuedAt: true, user: { select: { name: true } } } })
    : null;

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex rounded-md" aria-label="Narix Academy">
          <Logo />
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-pop sm:p-8">
          {cert ? (
            <>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-pass-soft text-pass" aria-hidden>
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="font-display text-lg font-semibold text-ink">Sertifikat etibarlıdır</h1>
                  <p className="text-sm text-muted">Narix Academy tərəfindən verilib</p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 border-t border-line pt-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Ad</dt>
                  <dd className="mt-0.5 break-words font-display text-xl font-semibold text-ink">{cert.user.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Kurs</dt>
                  <dd className="mt-0.5 text-ink-2">{COURSE_TITLE}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Tarix</dt>
                  <dd className="mt-0.5 text-ink-2">{formatAzDate(cert.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Kod</dt>
                  <dd className="mt-0.5 break-all font-mono text-sm text-ink-2">{code}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-bug-soft text-bug" aria-hidden>
                <ShieldX className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-lg font-semibold text-ink">Sertifikat tapılmadı</h1>
                <p className="text-sm text-muted">Kod səhvdir və ya sertifikat mövcud deyil.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

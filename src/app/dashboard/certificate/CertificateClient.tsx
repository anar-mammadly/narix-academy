"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Award, Check, Copy, Download, ExternalLink, Lock, Share2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar, ProgressRing } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import type { CertificateProgress } from "@/app/api/certificate/eligibility";
import { CertificateArt, PAPER_CSS } from "./CertificateArt";

const PRINT_CSS = `
@media screen { .cert-print-root { display: none; } }
@media print {
  @page { size: A4 landscape; margin: 0; }
  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
  body > *:not(.cert-print-root) { display: none !important; }
  .cert-print-root { display: block; width: 297mm; height: 209.5mm; overflow: hidden; }
}
`;

const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

type Props = {
  progress: CertificateProgress;
  name: string;
  course: string;
  origin: string;
  certificate: { code: string; date: string } | null;
  today: string;
};

export default function CertificateClient({ progress, name, course, origin, certificate, today }: Props) {
  return (
    <>
      <style>{PAPER_CSS + PRINT_CSS}</style>
      {certificate ? (
        <Issued name={name} course={course} origin={origin} code={certificate.code} date={certificate.date} />
      ) : (
        <Locked progress={progress} name={name} course={course} today={today} />
      )}
    </>
  );
}

function Issued({ name, course, origin, code, date }: { name: string; course: string; origin: string; code: string; date: string }) {
  const mounted = useMounted();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const verifyPath = `/verify/${encodeURIComponent(code)}`;
  const verifyUrl = `${origin}${verifyPath}`;
  const canShare = mounted && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      toast({ variant: "success", title: "Link kopyalandı" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "error", title: "Kopyalanmadı", description: verifyUrl });
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "Narix Academy sertifikatı", text: `${course} — sertifikat`, url: verifyUrl });
    } catch {
      /* user cancelled */
    }
  }

  const art = <CertificateArt name={name} course={course} date={date} code={code} verifyUrl={verifyUrl.replace(/^https?:\/\//, "")} />;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="pass"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Təsdiqlənib</Badge>
        <span className="text-sm text-muted">Verilib: {date}</span>
      </div>

      <figure className="overflow-hidden rounded-xl border border-line shadow-lift" aria-label={`Sertifikat: ${name}, ${course}, ${date}`}>
        {art}
      </figure>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button onClick={() => window.print()}>
          <Download className="h-4 w-4" aria-hidden /> PDF kimi yüklə
        </Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check className="h-4 w-4 text-pass" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "Kopyalandı" : "Linki kopyala"}
        </Button>
        {canShare && (
          <Button variant="secondary" onClick={share}>
            <Share2 className="h-4 w-4" aria-hidden /> Paylaş
          </Button>
        )}
        <Link href={verifyPath} target="_blank" className={buttonStyles({ variant: "ghost" })}>
          <ExternalLink className="h-4 w-4" aria-hidden /> Yoxlama səhifəsi <span className="sr-only">(yeni pəncərədə açılır)</span>
        </Link>
      </div>
      <p className="text-sm text-muted">
        Çap pəncərəsində “PDF kimi saxla” seç. Yoxlama səhifəsində yalnız adın, kurs və tarix görünür.
      </p>

      {mounted && createPortal(<div className="cert-print-root">{art}</div>, document.body)}
    </div>
  );
}

function Locked({ progress, name, course, today }: { progress: CertificateProgress; name: string; course: string; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { total, done, pct, needed, eligible } = progress;

  async function claim() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/certificate", { method: "POST" });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Alınmadı";
        throw new Error(msg);
      }
      toast({ variant: "success", title: "Təbriklər! Sertifikatın hazırdır" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Alınmadı");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
      <Card className="grid gap-5">
        <div className="flex items-center gap-4">
          <ProgressRing value={pct} size={88} stroke={9} tone={eligible ? "pass" : "iris"} label="Kurs irəliləyişi">
            <span className="font-display text-lg font-semibold text-ink">{pct}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{done} / {total} dərs bitib</p>
            <p className="text-sm text-muted">Tələb: görünən dərslərin 80%-i</p>
          </div>
        </div>

        <div>
          <div className="relative">
            <ProgressBar value={pct} tone={eligible ? "pass" : "iris"} size="lg" label="80% hədəfinə irəliləyiş" />
            <span className="absolute -top-1 bottom-[-4px] left-[80%] w-0.5 rounded-full bg-ink" aria-hidden />
          </div>
          <div className="relative mt-1.5 h-4 text-xs text-muted" aria-hidden>
            <span className="absolute left-0">0%</span>
            <span className="absolute left-[80%] -translate-x-1/2 font-semibold text-ink-2">80%</span>
            <span className="absolute right-0">100%</span>
          </div>
        </div>

        {eligible ? (
          <div className="grid gap-3">
            <p className="flex items-center gap-2 font-semibold text-pass">
              <Award className="h-5 w-5" aria-hidden /> Sertifikat almağa hazırsan!
            </p>
            {error && <p role="alert" className="text-sm text-bug">{error}</p>}
            <Button variant="success" size="lg" onClick={claim} loading={pending} block>
              Sertifikatı al
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-ink-2">
              <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              {total === 0 ? "Hələ açıq dərs yoxdur." : `Daha ${needed} dərs bitir — sertifikat açılacaq.`}
            </p>
            <Link href="/dashboard/lessons" className={buttonStyles({ variant: "secondary", block: true })}>
              Öyrənməyə davam et
            </Link>
          </div>
        )}
      </Card>

      <div className="relative" aria-hidden>
        <div className="overflow-hidden rounded-xl border border-line opacity-60 grayscale">
          <CertificateArt name={name} course={course} date={today} code="••••••••••" verifyUrl="narix/verify/••••" />
        </div>
        {!eligible && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-lift">
              <Lock className="h-4 w-4" /> {pct}% / 80%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

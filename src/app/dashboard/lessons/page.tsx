import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Clock, Lock, Play } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getStudentPath, type PathLesson } from "@/lib/curriculum";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleIcon } from "@/components/game/ModuleIcon";

export const metadata: Metadata = { title: "Öyrənmə yolu" };

export default async function LessonsPage({ searchParams }: { searchParams: Promise<{ locked?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [path, { locked }] = await Promise.all([getStudentPath(session.userId), searchParams]);

  const total = path.reduce((s, m) => s + m.lessons.length, 0);
  const done = path.reduce((s, m) => s + m.done, 0);

  return (
    <div>
      <PageHeader
        title="Öyrənmə yolu"
        description={`${path.length} modul, ${total} dərs. Hər dərs bir anlayışdır — ardıcıl keç, hər biri növbətini açır.`}
      />

      {locked && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-lg border border-xp-bright/40 bg-xp-soft px-4 py-3 text-sm text-ink">
          <Lock className="h-4 w-4 text-xp" aria-hidden /> Bu dərs hələ kilidlidir. Əvvəlki dərsi bitir, sonra açılacaq.
        </p>
      )}

      {total > 0 && (
        <div className="mb-8 rounded-xl border border-line bg-surface p-5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="font-semibold text-ink">Ümumi irəliləyiş</p>
            <p className="text-sm text-muted"><span className="font-display text-lg font-semibold text-ink">{done}</span> / {total} dərs keçildi</p>
          </div>
          <ProgressBar value={(done / total) * 100} tone="pass" size="lg" label="Ümumi irəliləyiş" />
        </div>
      )}

      {path.length === 0 ? (
        <EmptyState title="Hələ dərs yoxdur" description="Müəllim dərsləri dərc edən kimi burada görünəcək." />
      ) : (
        <ol className="grid gap-6">
          {path.map((m, mi) => {
            const pct = m.lessons.length ? (m.done / m.lessons.length) * 100 : 0;
            const complete = m.done === m.lessons.length;
            return (
              <li key={m.id} className="overflow-clip rounded-2xl border border-line bg-surface">
                <div className="relative flex items-start gap-4 p-5 sm:p-6" style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${m.color} 14%, transparent), transparent 65%)` }}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-pop" style={{ background: m.color }}>
                    <ModuleIcon name={m.icon} className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted">Modul {mi + 1}</p>
                    <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{m.title}</h2>
                    {m.description && <p className="mt-1 text-sm text-ink-2">{m.description}</p>}
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={pct} tone={complete ? "pass" : "iris"} size="sm" className="max-w-56" label={`${m.title} irəliləyişi`} />
                      <span className="shrink-0 text-xs font-medium text-muted">{m.done}/{m.lessons.length}</span>
                    </div>
                  </div>
                  {complete && <span className="hidden rounded-full bg-pass-soft px-3 py-1 text-xs font-semibold text-pass sm:inline">Modul keçildi</span>}
                </div>
                <ol className="relative px-3 pb-3 sm:px-4 sm:pb-4">
                  {m.lessons.map((l, i) => (
                    <LessonRow key={l.id} lesson={l} last={i === m.lessons.length - 1} />
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

const statusText: Record<PathLesson["status"], string> = { done: "Keçdi", current: "Növbəti", open: "Açıq", locked: "Kilidli" };

function LessonRow({ lesson: l, last }: { lesson: PathLesson; last: boolean }) {
  const node = (
    <span
      className={cn(
        "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2",
        l.status === "done" && "border-pass-bright bg-pass-bright text-[#06281c]",
        l.status === "current" && "border-iris bg-iris text-white animate-pulse-ring",
        l.status === "open" && "border-iris bg-surface text-iris",
        l.status === "locked" && "border-line bg-surface-2 text-muted"
      )}
      aria-hidden
    >
      {l.status === "done" ? <Check className="h-5 w-5" strokeWidth={3} /> : l.status === "locked" ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
    </span>
  );

  const body = (
    <>
      <div className="relative flex flex-col items-center self-stretch">
        {node}
        {!last && <span aria-hidden className={cn("absolute top-10 -bottom-3 w-0.5", l.status === "done" ? "bg-pass-bright/60" : "bg-line")} />}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className={cn("font-semibold", l.status === "locked" ? "text-muted" : "text-ink")}>{l.title}</p>
        <p className="mt-0.5 flex items-center gap-3 text-sm text-muted">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {l.estimatedMinutes} dəq</span>
          <span className={cn(
            "rounded px-1.5 text-xs font-semibold",
            l.status === "done" && "bg-pass-soft text-pass",
            l.status === "current" && "bg-iris-soft text-iris-ink",
            l.status === "open" && "bg-surface-2 text-ink-2",
            l.status === "locked" && "bg-surface-2 text-muted"
          )}>{statusText[l.status]}</span>
        </p>
        {l.status === "current" && l.shortDescription && <p className="mt-2 line-clamp-2 text-sm text-ink-2">{l.shortDescription}</p>}
      </div>
      {l.status === "current" && (
        <span className="hidden shrink-0 items-center gap-1.5 self-center rounded-lg bg-iris px-4 py-2.5 text-sm font-semibold text-white sm:flex">
          Başla <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </>
  );

  return (
    <li>
      {l.status === "locked" ? (
        <div className="flex gap-4 rounded-xl px-2 py-2.5" aria-label={`${l.title} — kilidli`}>{body}</div>
      ) : (
        <Link
          href={`/learn/${l.slug}`}
          className={cn(
            "flex gap-4 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2",
            l.status === "current" && "bg-iris-soft/50 ring-1 ring-iris/25 hover:bg-iris-soft"
          )}
        >
          {body}
        </Link>
      )}
    </li>
  );
}

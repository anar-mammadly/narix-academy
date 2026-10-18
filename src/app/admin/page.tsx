import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { az } from "date-fns/locale";
import {
  Activity, BookOpen, CheckCircle2, ClipboardList, MessageCircle, Percent, Plus, Send, UserPlus, Users, BellRing,
} from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/components/admin/StatTile";
import { loadStudentRows } from "@/components/admin/student-stats";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonStyles } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Ümumi baxış" };

const DAY = 24 * 60 * 60 * 1000;
/** Server-side time helper (kept out of the component body). */
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const ago = (d: Date) => formatDistanceToNowStrict(d, { addSuffix: true, locale: az });

type ActivityItem = { id: string; at: Date; who: string; text: string; href: string; kind: "lesson" | "homework" | "question" };

export default async function AdminPage() {
  const session = await requireTeacher();
  const weekAgo = daysAgo(7);

  const [{ rows: students, totalLessons: total }, openQuestions, ungraded, activeWeek, recentDone, recentHw, recentQ] = await Promise.all([
    loadStudentRows(),
    prisma.question.count({ where: { status: "OPEN" } }),
    prisma.homeworkSubmit.count({ where: { grade: null, status: "SUBMITTED" } }),
    prisma.xpEvent.groupBy({ by: ["userId"], where: { createdAt: { gte: weekAgo }, user: { role: "STUDENT" } } }),
    prisma.progress.findMany({
      where: { completed: true, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: 8,
      select: { id: true, completedAt: true, user: { select: { name: true } }, lesson: { select: { title: true } } },
    }),
    prisma.homeworkSubmit.findMany({
      orderBy: { submittedAt: "desc" },
      take: 6,
      select: { id: true, submittedAt: true, user: { select: { name: true } }, homework: { select: { title: true } } },
    }),
    prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, createdAt: true, title: true, user: { select: { name: true } } },
    }),
  ]);

  const avgCompletion = students.length ? Math.round(students.reduce((s, u) => s + u.progress, 0) / students.length) : 0;
  const needAttention = students
    .map((s) => ({ ...s, last: s.lastActive ? new Date(s.lastActive) : null }))
    .filter((s) => !s.last || s.last < weekAgo)
    .sort((a, b) => (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0))
    .slice(0, 6);

  const activity: ActivityItem[] = [
    ...recentDone.map((p): ActivityItem => ({ id: `p-${p.id}`, at: p.completedAt!, who: p.user.name, text: `“${p.lesson.title}” dərsini bitirdi`, href: "/admin/students", kind: "lesson" })),
    ...recentHw.map((h): ActivityItem => ({ id: `h-${h.id}`, at: h.submittedAt, who: h.user.name, text: `“${h.homework.title}” tapşırığını göndərdi`, href: "/admin/homework", kind: "homework" })),
    ...recentQ.map((q): ActivityItem => ({ id: `q-${q.id}`, at: q.createdAt, who: q.user.name, text: `sual verdi: “${q.title}”`, href: "/admin/questions", kind: "question" })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  const kindIcon = {
    lesson: <CheckCircle2 className="h-4 w-4 text-pass" aria-hidden />,
    homework: <Send className="h-4 w-4 text-sky" aria-hidden />,
    question: <MessageCircle className="h-4 w-4 text-flame" aria-hidden />,
  };

  const firstName = session.name.split(" ")[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={`Salam, ${firstName}`}
        description="Kursun bu həftəki vəziyyəti və diqqət tələb edən işlər."
        actions={
          <>
            <Link href="/admin/students/new" className={buttonStyles({ variant: "secondary" })}><UserPlus className="h-4 w-4" aria-hidden /> Tələbə</Link>
            <Link href="/admin/modules" className={buttonStyles()}><Plus className="h-4 w-4" aria-hidden /> Dərs yarat</Link>
          </>
        }
      />

      <section aria-label="Əsas göstəricilər" className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-4">
        <StatTile label="Tələbələr" value={students.length} icon={Users} tone="iris" href="/admin/students" />
        <StatTile label="Yayımlanmış dərslər" value={total} icon={BookOpen} tone="sky" href="/admin/modules" />
        <StatTile label="Orta irəliləyiş" value={`${avgCompletion}%`} hint="yayımlanmış dərslər üzrə" icon={Percent} tone="pass" />
        <StatTile label="Bu həftə aktiv" value={activeWeek.length} hint={students.length ? `${students.length} tələbədən` : undefined} icon={Activity} tone="xp" />
        <StatTile label="Açıq suallar" value={openQuestions} icon={MessageCircle} tone="flame" href="/admin/questions" alert={openQuestions > 0} />
        <StatTile label="Yoxlanılmamış tapşırıqlar" value={ungraded} icon={ClipboardList} tone="bug" href="/admin/homework" alert={ungraded > 0} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Son fəaliyyət</CardTitle>
          </CardHeader>
          {activity.length === 0 ? (
            <EmptyState icon={<Activity className="h-6 w-6" />} title="Hələ fəaliyyət yoxdur" description="Tələbələr dərs bitirdikdə, sual verdikdə və ya tapşırıq göndərdikdə burada görünəcək." />
          ) : (
            <ul className="-mx-2 divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2">{kindIcon[a.kind]}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold text-ink">{a.who}</span> <span className="text-ink-2">{a.text}</span>
                      <span className="mt-0.5 block text-xs text-muted">{ago(a.at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display"><BellRing className="h-4 w-4 text-flame" aria-hidden /> Diqqət tələb edənlər</CardTitle>
          </CardHeader>
          <p className="-mt-2 mb-3 text-sm text-muted">7 gündən çoxdur aktivlik göstərməyən tələbələr.</p>
          {needAttention.length === 0 ? (
            <p className="rounded-lg bg-pass-soft p-4 text-sm font-medium text-pass">Hamı aktivdir. Əla!</p>
          ) : (
            <ul className="space-y-3">
              {needAttention.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{s.name}</span>
                      <span className="shrink-0 text-xs text-muted">{s.last ? ago(s.last) : "heç başlamayıb"}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={s.progress} size="sm" label={`${s.name}: irəliləyiş`} />
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-2">{s.progress}%</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {needAttention.length > 0 && (
            <Link href="/admin/students?filter=inactive" className={buttonStyles({ variant: "ghost", size: "sm", className: "mt-4" })}>Bütün siyahı</Link>
          )}
        </Card>
      </div>
    </div>
  );
}

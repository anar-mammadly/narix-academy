import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth";
import { isRemoteImageSrc } from "@/frontend/lib/remote-image";
import { Card, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const modules = await prisma.module.findMany({
    where: {
      published: true,
      contentVisibility: {
        none: { studentId: session.userId, visible: false, lessonId: null },
      },
    },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: {
          published: true,
          contentVisibility: { none: { studentId: session.userId, visible: false } },
        },
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId: session.userId },
            take: 1,
          },
        },
      },
    },
  });

  const allLessons = modules.flatMap((m) => m.lessons);
  const completed = allLessons.filter((l) => l.progress[0]?.completed).length;
  const total = allLessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200/40 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-600 p-8 text-white shadow-glow md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-900/20 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-indigo-100">Xoş gəldiniz</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{session.name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-indigo-100/95">
            Canlı dərsdən sonra materialları burada oxuyun, tapşırıqları təqdim edin və irəliləyişinizi izləyin.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200/80 p-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-sm font-medium text-slate-500">Ümumi irəliləyiş</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">{pct}%</p>
            <p className="text-sm text-slate-500">
              {completed} / {total} dərs tamamlanıb
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </Card>
        <Card className="border-slate-200/80 p-0 md:col-span-2">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-sm font-medium text-slate-500">Tez keçidlər</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2 px-6 pb-6">
            {allLessons.slice(0, 4).map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/lessons/${l.slug}`}
                className="rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/80 hover:shadow-md"
              >
                {l.title}
              </Link>
            ))}
            {allLessons.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center animate-fade-in">
                <p className="text-sm font-medium text-slate-600">Hələ dərs yoxdur</p>
                <p className="mt-1 text-xs text-slate-500">Müəllim dərc etdikdə burada görünəcək.</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <section id="dersler" className="scroll-mt-24">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Modullar və dərslər</h2>
        <div className="space-y-10">
          {modules.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-center shadow-soft animate-fade-in">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">Modul tapılmadı</p>
              <p className="mt-1 text-xs text-slate-500">Dərc edilmiş modul əlavə olunanda burada göstəriləcək.</p>
            </div>
          ) : null}
          {modules.map((mod) => (
            <div key={mod.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <BookOpen className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{mod.title}</h3>
              </div>
              {mod.description ? <p className="mb-4 text-sm leading-relaxed text-slate-600">{mod.description}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {mod.lessons.map((lesson) => {
                  const done = lesson.progress[0]?.completed;
                  return (
                    <Link key={lesson.id} href={`/dashboard/lessons/${lesson.slug}`}>
                      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
                        {lesson.coverImageUrl ? (
                          <div className="relative h-32 w-full bg-slate-100">
                            <Image
                              src={lesson.coverImageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized={isRemoteImageSrc(lesson.coverImageUrl)}
                            />
                          </div>
                        ) : null}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-slate-900">{lesson.title}</h4>
                            {done ? (
                              <Badge variant="success" className="shrink-0 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Bitdi
                              </Badge>
                            ) : (
                              <Badge variant="muted" className="shrink-0 gap-1">
                                <Circle className="h-3 w-3" />
                                Açıq
                              </Badge>
                            )}
                          </div>
                          {lesson.shortDescription ? (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{lesson.shortDescription}</p>
                          ) : null}
                          <p className="mt-3 text-xs text-slate-400">~{lesson.estimatedMinutes} dəq</p>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
              {mod.lessons.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-500">
                  Bu modulda dərc edilmiş dərs yoxdur.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

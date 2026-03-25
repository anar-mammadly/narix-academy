import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRemoteImageSrc } from "@/lib/remote-image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lift">
        <p className="text-sm font-medium text-blue-100">Xoş gəldiniz</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">{session.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-blue-100">
          Canlı dərsdən sonra materialları burada oxuyun, tapşırıqları təqdim edin və irəliləyişinizi izləyin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Ümumi irəliləyiş</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-3xl font-bold text-slate-900">{pct}%</p>
            <p className="text-sm text-slate-500">
              {completed} / {total} dərs tamamlanıb
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">Tez keçidlər</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2 px-6 pb-6">
            {allLessons.slice(0, 4).map((l) => (
              <Link
                key={l.id}
                href={`/dashboard/lessons/${l.slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 hover:border-blue-200 hover:bg-blue-50"
              >
                {l.title}
              </Link>
            ))}
            {allLessons.length === 0 ? <span className="text-sm text-slate-500">Dərc edilmiş dərs yoxdur.</span> : null}
          </div>
        </Card>
      </div>

      <section id="dersler">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Modullar və dərslər</h2>
        <div className="space-y-8">
          {modules.map((mod) => (
            <div key={mod.id}>
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
              </div>
              {mod.description ? <p className="mb-4 text-sm text-slate-600">{mod.description}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {mod.lessons.map((lesson) => {
                  const done = lesson.progress[0]?.completed;
                  return (
                    <Link key={lesson.id} href={`/dashboard/lessons/${lesson.slug}`}>
                      <Card className="h-full overflow-hidden transition-transform hover:-translate-y-0.5">
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
                <p className="text-sm text-slate-500">Bu modulda dərc edilmiş dərs yoxdur.</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

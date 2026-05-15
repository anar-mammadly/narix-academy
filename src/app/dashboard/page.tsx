import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2, Trophy, Zap, ArrowRight, Clock, Flame } from "lucide-react";
import { calculateProgress, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [allLessons, progress, recentProgress] = await Promise.all([
    prisma.lesson.findMany({
      where: { published: true },
      include: { module: true },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.progress.findMany({ where: { userId: session.userId } }),
    prisma.progress.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { lesson: { include: { module: { select: { title: true } } } } },
    }),
  ]);

  const completedCount = progress.filter(p => p.completed).length;
  const totalCount = allLessons.length;
  const progressPct = calculateProgress(completedCount, totalCount);
  const passedQuizzes = progress.filter(p => p.quizPassed);
  const avgScore = passedQuizzes.length
    ? Math.round(passedQuizzes.reduce((s, p) => s + (p.quizScore ?? 0), 0) / passedQuizzes.length)
    : 0;

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));
  const nextLesson = allLessons.find(l => !completedIds.has(l.id));

  const firstName = session.name.split(" ")[0];

  const hours = new Date().getHours();
  const greeting = hours < 12 ? "Sabahın xeyir" : hours < 17 ? "Günortanız xeyir" : "Axşamınız xeyir";

  return (
    <div className="space-y-6 stagger">

      {/* Hero greeting */}
      <div className="slide-up">
        <div className="text-muted text-sm font-medium">{greeting} 👋</div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-0.5">
          Xoş gəldin, <span className="text-blue-600">{firstName}</span>!
        </h1>
        <p className="text-muted mt-1 text-sm">Öyrənməyə davam et — hər gün bir addım irəli.</p>
      </div>

      {/* Progress card */}
      <div className="slide-up" style={{animationDelay:"60ms"}}>
        <div className="card bg-gradient-to-br from-blue-600 to-cyan-500 border-0 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Ümumi irəliləyiş</div>
              <div className="text-4xl font-black">{progressPct}%</div>
              <div className="text-blue-100 text-sm mt-0.5">{completedCount}/{totalCount} dərs tamamlandı</div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Zap size={28} className="text-white" />
            </div>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%`, animation: "progressFill 1.5s cubic-bezier(0.16,1,0.3,1) both" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 slide-up" style={{animationDelay:"120ms"}}>
        <div className="card text-center py-5">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
          <div className="text-xs text-muted mt-0.5">Tamamlanan dərs</div>
        </div>
        <div className="card text-center py-5">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Trophy size={20} className="text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgScore > 0 ? `${avgScore}%` : "—"}</div>
          <div className="text-xs text-muted mt-0.5">Ortalama quiz balı</div>
        </div>
      </div>

      {/* Continue learning */}
      {nextLesson && (
        <div className="slide-up" style={{animationDelay:"180ms"}}>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted">
            <Flame size={15} className="text-orange-500" /> Davam et
          </h2>
          <Link href={`/dashboard/lessons/${nextLesson.slug}`} className="card-hover block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted mb-0.5 truncate">{nextLesson.module.title}</div>
                <div className="font-bold text-gray-900 truncate">{nextLesson.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                  <Clock size={11} /> {formatTime(nextLesson.estimatedMinutes)}
                </div>
              </div>
              <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <ArrowRight size={16} className="text-white" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Recent activity */}
      {recentProgress.length > 0 && (
        <div className="slide-up" style={{animationDelay:"240ms"}}>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted">
            Son fəaliyyət
          </h2>
          <div className="space-y-2">
            {recentProgress.map((p, i) => (
              <Link key={p.id} href={`/dashboard/lessons/${p.lesson.slug}`}
                className="card-hover flex items-center gap-3 py-3 px-4"
                style={{animationDelay:`${i*40}ms`}}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${p.completed ? "bg-green-100" : "bg-blue-100"}`}>
                  <CheckCircle2 size={16} className={p.completed ? "text-green-600" : "text-blue-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{p.lesson.title}</div>
                  <div className="text-xs text-muted truncate">{p.lesson.module.title}</div>
                </div>
                {p.quizScore !== null && (
                  <div className={`badge ${p.quizPassed ? "badge-green" : "badge-red"} shrink-0`}>
                    {p.quizScore}%
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

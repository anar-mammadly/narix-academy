import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2, Trophy, Zap, ArrowRight, Clock } from "lucide-react";
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
      take: 3,
      include: { lesson: { include: { module: true } } },
    }),
  ]);

  const completedCount = progress.filter(p => p.completed).length;
  const totalCount = allLessons.length;
  const progressPct = calculateProgress(completedCount, totalCount);
  const passedQuizzes = progress.filter(p => p.quizPassed);
  const avgScore = passedQuizzes.length
    ? Math.round(passedQuizzes.reduce((s, p) => s + (p.quizScore ?? 0), 0) / passedQuizzes.length)
    : 0;

  // Find next uncompleted lesson
  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));
  const nextLesson = allLessons.find(l => !completedIds.has(l.id));

  const stats = [
    { label: "Tamamlanan dərslər", value: `${completedCount}/${totalCount}`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Ortalama quiz balı", value: avgScore > 0 ? `${avgScore}%` : "—", icon: Trophy, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Ümumi irəliləyiş", value: `${progressPct}%`, icon: Zap, color: "text-cyan-600", bg: "bg-cyan-50" },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Salam, {session.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted mt-1">Öyrənməyə davam et — hər gün bir addım irəli!</p>
      </div>

      {/* Progress overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-gray-900">Ümumi irəliləyiş</div>
            <div className="text-sm text-muted">{completedCount} dərs tamamlanıb, {totalCount - completedCount} qalıb</div>
          </div>
          <div className="text-3xl font-bold text-blue-700">{progressPct}%</div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card text-center">
            <div className={`inline-flex w-11 h-11 rounded-xl ${bg} items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      {nextLesson && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" /> Davam et
          </h2>
          <Link href={`/dashboard/lessons/${nextLesson.slug}`} className="card-hover block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <BookOpen size={22} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted mb-0.5">{nextLesson.module.title}</div>
                  <div className="font-semibold text-gray-900">{nextLesson.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted mt-1">
                    <Clock size={12} /> {formatTime(nextLesson.estimatedMinutes)}
                  </div>
                </div>
              </div>
              <div className="btn-primary btn-sm shrink-0">
                Başla <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Recent activity */}
      {recentProgress.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Son fəaliyyət</h2>
          <div className="space-y-2">
            {recentProgress.map(p => (
              <Link key={p.id} href={`/dashboard/lessons/${p.lesson.slug}`} className="card-hover flex items-center gap-4 py-3 px-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.completed ? "bg-green-100" : "bg-yellow-100"}`}>
                  <CheckCircle2 size={16} className={p.completed ? "text-green-600" : "text-yellow-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.lesson.title}</div>
                  <div className="text-xs text-muted">{p.lesson.module.title}</div>
                </div>
                {p.quizScore !== null && (
                  <div className={`badge ${p.quizPassed ? "badge-green" : "badge-red"}`}>
                    {p.quizScore}%
                  </div>
                )}
                {p.completed && !p.quizScore && <div className="badge badge-green">Tamamlandı</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

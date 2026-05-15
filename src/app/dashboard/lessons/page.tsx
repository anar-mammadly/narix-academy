import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, PlayCircle, Clock, Lock, ChevronRight } from "lucide-react";
import { formatTime, cn } from "@/lib/utils";

export default async function LessonsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [modules, progress, visibility] = await Promise.all([
    prisma.module.findMany({
      where: { published: true },
      include: { lessons: { where: { published: true }, orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    prisma.progress.findMany({ where: { userId: session.userId } }),
    prisma.studentContentVisibility.findMany({ where: { studentId: session.userId } }),
  ]);

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));
  const hiddenModuleIds = new Set(visibility.filter(v => !v.visible && v.moduleId).map(v => v.moduleId!));
  const hiddenLessonIds = new Set(visibility.filter(v => !v.visible && v.lessonId).map(v => v.lessonId!));
  const visibleModules = modules.filter(m => !hiddenModuleIds.has(m.id));

  return (
    <div className="space-y-6 fade-in">
      <div className="slide-up">
        <h1 className="text-2xl font-bold text-gray-900">Dərslər</h1>
        <p className="text-muted mt-1 text-sm">Bütün modullar və dərslər</p>
      </div>

      {visibleModules.map((mod, modIdx) => {
        const visibleLessons = mod.lessons.filter(l => !hiddenLessonIds.has(l.id));
        if (!visibleLessons.length) return null;
        const modCompleted = visibleLessons.filter(l => completedIds.has(l.id)).length;
        const modPct = Math.round((modCompleted / visibleLessons.length) * 100);

        return (
          <div key={mod.id} className="slide-up" style={{ animationDelay: `${modIdx * 50}ms` }}>
            {/* Module header */}
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {modIdx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate">{mod.title}</div>
                <div className="text-xs text-muted">{modCompleted}/{visibleLessons.length} tamamlandı</div>
              </div>
              <div className="text-sm font-bold text-blue-600 shrink-0">{modPct}%</div>
            </div>

            {/* Progress */}
            <div className="progress-bar mb-3 mx-1">
              <div className="progress-fill" style={{ width: `${modPct}%` }} />
            </div>

            {/* Lessons */}
            <div className="card p-2 space-y-1">
              {visibleLessons.map((lesson, idx) => {
                const done = completedIds.has(lesson.id);
                const prog = progress.find(p => p.lessonId === lesson.id);
                return (
                  <Link key={lesson.id} href={`/dashboard/lessons/${lesson.slug}`}
                    className={cn("flex items-center gap-3 p-3 rounded-xl transition-all",
                      "hover:bg-blue-50 active:bg-blue-100")}>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      done ? "bg-green-100" : "bg-gray-100")}>
                      {done
                        ? <CheckCircle2 size={16} className="text-green-600" />
                        : <PlayCircle size={16} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-semibold truncate", done ? "text-gray-500" : "text-gray-900")}>
                        {lesson.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock size={10} /> {formatTime(lesson.estimatedMinutes)}
                        </span>
                        {lesson.quizEnabled && <span className="badge badge-blue" style={{fontSize:"10px",padding:"1px 6px"}}>Quiz</span>}
                      </div>
                    </div>
                    {prog?.quizScore != null && (
                      <div className={cn("badge shrink-0", prog.quizPassed ? "badge-green" : "badge-red")}>
                        {prog.quizScore}%
                      </div>
                    )}
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

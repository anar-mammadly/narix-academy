import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle, Clock, BookOpen } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default async function LessonsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [modules, progress, visibility] = await Promise.all([
    prisma.module.findMany({
      where: { published: true },
      include: {
        lessons: {
          where: { published: true },
          orderBy: { order: "asc" },
        },
      },
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
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dərslər</h1>
        <p className="text-muted mt-1">Bütün modullar və dərslər</p>
      </div>

      {visibleModules.map((mod, modIdx) => {
        const visibleLessons = mod.lessons.filter(l => !hiddenLessonIds.has(l.id));
        if (!visibleLessons.length) return null;
        const modCompleted = visibleLessons.filter(l => completedIds.has(l.id)).length;

        return (
          <div key={mod.id} className="slide-up" style={{ animationDelay: `${modIdx * 60}ms` }}>
            {/* Module header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {modIdx + 1}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{mod.title}</h2>
                  <div className="text-xs text-muted">{modCompleted}/{visibleLessons.length} tamamlanıb</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar mb-3">
              <div
                className="progress-fill"
                style={{ width: `${visibleLessons.length ? (modCompleted / visibleLessons.length) * 100 : 0}%` }}
              />
            </div>

            {/* Lessons */}
            <div className="space-y-2">
              {visibleLessons.map((lesson, idx) => {
                const done = completedIds.has(lesson.id);
                const prog = progress.find(p => p.lessonId === lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/lessons/${lesson.slug}`}
                    className="card-hover flex items-center gap-4 py-3 px-5"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      done ? "bg-green-100" : "bg-blue-50"
                    }`}>
                      {done
                        ? <CheckCircle2 size={18} className="text-green-600" />
                        : <PlayCircle size={18} className="text-blue-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted font-medium">{modIdx + 1}.{idx + 1}</span>
                        <span className="font-semibold text-gray-900 truncate">{lesson.title}</span>
                      </div>
                      {lesson.shortDescription && (
                        <p className="text-xs text-muted mt-0.5 truncate">{lesson.shortDescription}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Clock size={12} /> {formatTime(lesson.estimatedMinutes)}
                      </div>
                      {prog?.quizScore !== null && prog?.quizScore !== undefined && (
                        <div className={`badge ${prog.quizPassed ? "badge-green" : "badge-red"}`}>
                          {prog.quizScore}%
                        </div>
                      )}
                      {lesson.quizEnabled && <div className="badge badge-blue">Quiz</div>}
                    </div>
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

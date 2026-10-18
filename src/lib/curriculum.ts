import "server-only";
import { prisma } from "./prisma";

export type PathLesson = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  estimatedMinutes: number;
  order: number;
  status: "done" | "current" | "open" | "locked";
};

export type PathModule = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  order: number;
  lessons: PathLesson[];
  done: number;
};

/**
 * Published modules/lessons the student may see, in path order, with status.
 * Hidden content (StudentContentVisibility.visible = false) is left out.
 * A lesson is unlocked when the previous lesson on the path is done, or when
 * the student already has progress on it.
 */
export async function getStudentPath(userId: string): Promise<PathModule[]> {
  const [modules, hidden, progress] = await Promise.all([
    prisma.module.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: { id: true, slug: true, title: true, shortDescription: true, estimatedMinutes: true, order: true },
        },
      },
    }),
    prisma.studentContentVisibility.findMany({ where: { studentId: userId, visible: false } }),
    prisma.progress.findMany({ where: { userId }, select: { lessonId: true, completed: true } }),
  ]);

  const hiddenModules = new Set(hidden.map((h) => h.moduleId).filter(Boolean));
  const hiddenLessons = new Set(hidden.map((h) => h.lessonId).filter(Boolean));
  const progressMap = new Map(progress.map((p) => [p.lessonId, p.completed]));

  let previousDone = true;
  let currentAssigned = false;
  return modules
    .filter((m) => !hiddenModules.has(m.id))
    .map((m) => {
      const lessons = m.lessons
        .filter((l) => !hiddenLessons.has(l.id))
        .map((l): PathLesson => {
          const done = progressMap.get(l.id) === true;
          const started = progressMap.has(l.id);
          let status: PathLesson["status"];
          if (done) status = "done";
          else if (previousDone || started) {
            status = currentAssigned ? "open" : "current";
            currentAssigned = true;
          } else status = "locked";
          previousDone = done;
          return { ...l, status };
        });
      return {
        id: m.id, title: m.title, description: m.description, icon: m.icon, color: m.coverColor, order: m.order,
        lessons, done: lessons.filter((l) => l.status === "done").length,
      };
    })
    .filter((m) => m.lessons.length > 0);
}

export function flattenPath(path: PathModule[]) {
  return path.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title, moduleColor: m.color })));
}

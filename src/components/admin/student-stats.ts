import "server-only";
import { prisma } from "@/lib/prisma";
import { dayKey, levelFromXp, previousDay } from "@/lib/game";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  completed: number;
  progress: number;
  lastActive: string | null;
};

const latest = (...dates: (Date | null | undefined)[]) =>
  dates.reduce<Date | null>((max, d) => (d && (!max || d > max) ? d : max), null);

/** Per-student progress, XP/level, live streak and last activity, plus the published lesson total. */
export async function loadStudentRows(): Promise<{ rows: StudentRow[]; totalLessons: number }> {
  const publishedWhere = { published: true, module: { published: true } };
  const [students, totalLessons, done, lastXp, lastProgress] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true, xp: true, streakCount: true, lastActiveDay: true },
    }),
    prisma.lesson.count({ where: publishedWhere }),
    prisma.progress.groupBy({ by: ["userId"], where: { completed: true, lesson: publishedWhere }, _count: { _all: true } }),
    prisma.xpEvent.groupBy({ by: ["userId"], _max: { createdAt: true } }),
    prisma.progress.groupBy({ by: ["userId"], _max: { updatedAt: true } }),
  ]);

  const doneMap = new Map(done.map((d) => [d.userId, d._count._all]));
  const xpMap = new Map(lastXp.map((x) => [x.userId, x._max.createdAt]));
  const progMap = new Map(lastProgress.map((p) => [p.userId, p._max.updatedAt]));
  const today = dayKey();
  const yesterday = previousDay(today);

  const rows = students.map((s): StudentRow => {
    const completed = doneMap.get(s.id) ?? 0;
    const lvl = levelFromXp(s.xp);
    // A stored streak only counts while the student was active today or yesterday.
    const streak = s.lastActiveDay === today || s.lastActiveDay === yesterday ? s.streakCount : 0;
    const last = latest(xpMap.get(s.id), progMap.get(s.id));
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      avatarUrl: s.avatarUrl,
      createdAt: s.createdAt.toISOString(),
      xp: s.xp,
      level: lvl.level,
      levelTitle: lvl.title,
      streak,
      completed,
      progress: totalLessons ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0,
      lastActive: last ? last.toISOString() : null,
    };
  });

  return { rows, totalLessons };
}

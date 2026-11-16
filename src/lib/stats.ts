import "server-only";
import { prisma } from "./prisma";
import { compareAz } from "./utils";
import { dayKey, lastWeekDays, levelFromXp } from "./game";

/** "Aysel Məmmədova" → "Aysel M." — leaderboards show no more than needed. */
export function publicName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toLocaleUpperCase("az")}.` : first;
}

export type BoardRow = { userId: string; name: string; avatarUrl: string | null; xp: number; level: number; streak: number; rank: number };

export async function leaderboard(range: "week" | "all", limit = 50): Promise<BoardRow[]> {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, avatarUrl: true, xp: true, streakCount: true },
  });
  let score = new Map(students.map((s) => [s.id, s.xp]));
  if (range === "week") {
    const since = lastWeekDays()[0];
    const rows = await prisma.xpEvent.groupBy({ by: ["userId"], where: { day: { gte: since } }, _sum: { amount: true } });
    score = new Map(students.map((s) => [s.id, 0]));
    for (const r of rows) if (score.has(r.userId)) score.set(r.userId, r._sum.amount ?? 0);
  }
  return students
    .map((s) => ({ userId: s.id, name: publicName(s.name), avatarUrl: s.avatarUrl, xp: score.get(s.id) ?? 0, level: levelFromXp(s.xp).level, streak: s.streakCount, rank: 0 }))
    .sort((a, b) => b.xp - a.xp || compareAz(a.name, b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }))
    .slice(0, limit);
}

/** XP earned per day for the last 7 Baku days, oldest first. */
export async function weekActivity(userId: string) {
  const days = lastWeekDays();
  const rows = await prisma.xpEvent.groupBy({ by: ["day"], where: { userId, day: { gte: days[0] } }, _sum: { amount: true } });
  const map = new Map(rows.map((r) => [r.day, r._sum.amount ?? 0]));
  return days.map((d) => ({ day: d, xp: map.get(d) ?? 0, today: d === dayKey() }));
}

/** XP earned per day for the last `days` Baku days, oldest first. */
export async function recentActivity(userId: string, days = 14) {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(Date.now() - i * 86_400_000)));
  const rows = await prisma.xpEvent.groupBy({ by: ["day"], where: { userId, day: { gte: keys[0] } }, _sum: { amount: true } });
  const map = new Map(rows.map((r) => [r.day, r._sum.amount ?? 0]));
  return keys.map((d) => ({ day: d, xp: map.get(d) ?? 0 }));
}

/** Lessons completed by students per day for the last `days` Baku days, oldest first. */
export async function recentCompletions(days = 14) {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(Date.now() - i * 86_400_000)));
  const rows = await prisma.progress.findMany({
    where: { completed: true, completedAt: { gte: new Date(Date.now() - days * 86_400_000) }, user: { role: "STUDENT" } },
    select: { completedAt: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) if (r.completedAt) map.set(dayKey(r.completedAt), (map.get(dayKey(r.completedAt)) ?? 0) + 1);
  return keys.map((d) => ({ day: d, count: map.get(d) ?? 0 }));
}

/** Share of each published module's lessons completed, averaged over all students (0–100). */
export async function moduleCompletion() {
  const [students, lessons] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.lesson.findMany({
      where: { published: true, module: { published: true } },
      select: { module: { select: { id: true, title: true, order: true } }, _count: { select: { progress: { where: { completed: true, user: { role: "STUDENT" } } } } } },
    }),
  ]);
  const byModule = new Map<string, { title: string; order: number; lessons: number; done: number }>();
  for (const l of lessons) {
    const m = byModule.get(l.module.id) ?? { title: l.module.title, order: l.module.order, lessons: 0, done: 0 };
    m.lessons += 1;
    m.done += l._count.progress;
    byModule.set(l.module.id, m);
  }
  return [...byModule.values()]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({ title: m.title, percent: students && m.lessons ? Math.round((m.done / (m.lessons * students)) * 100) : 0 }));
}

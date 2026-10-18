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

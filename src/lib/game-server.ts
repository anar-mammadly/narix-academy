import "server-only";
import { prisma } from "./prisma";
import { ACHIEVEMENT_MAP, STREAK_BONUS, dayKey, levelFromXp, previousDay, type Reward } from "./game";

type Grant = { amount: number; reason: string; refId: string };

/**
 * Pays XP grants (each at most once), moves the streak, unlocks achievements
 * and returns what changed so the client can celebrate it.
 */
export async function reward(userId: string, grants: Grant[]): Promise<Reward> {
  const today = dayKey();
  const before = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, streakCount: true, longestStreak: true, lastActiveDay: true },
  });

  let gained = 0;
  for (const g of grants.filter((g) => g.amount > 0)) {
    gained += await grantOnce(userId, g, today);
  }

  let streak = before.streakCount;
  if (gained > 0 && before.lastActiveDay !== today) {
    streak = before.lastActiveDay === previousDay(today) ? before.streakCount + 1 : 1;
    await prisma.user.update({
      where: { id: userId },
      data: { streakCount: streak, longestStreak: Math.max(before.longestStreak, streak), lastActiveDay: today },
    });
    const bonus = STREAK_BONUS[streak];
    if (bonus) gained += await grantOnce(userId, { amount: bonus, reason: "STREAK", refId: `${streak}-${today}` }, today);
  }

  const unlocked = await checkAchievements(userId, streak);
  for (const a of unlocked) {
    const def = ACHIEVEMENT_MAP[a];
    if (def?.xp) gained += await grantOnce(userId, { amount: def.xp, reason: "ACHIEVEMENT", refId: a }, today);
  }

  const totalXp = before.xp + gained;
  const levelBefore = levelFromXp(before.xp).level;
  const levelAfter = levelFromXp(totalXp).level;
  return {
    xpGained: gained,
    totalXp,
    level: levelAfter,
    leveledUp: levelAfter > levelBefore,
    streak,
    achievements: unlocked.map((key) => ({ key, title: ACHIEVEMENT_MAP[key]?.title ?? key })),
  };
}

async function grantOnce(userId: string, g: Grant, day: string): Promise<number> {
  // ON CONFLICT DO NOTHING: an already-paid (userId, reason, refId) inserts nothing.
  const { count } = await prisma.xpEvent.createMany({
    data: [{ userId, amount: g.amount, reason: g.reason, refId: g.refId, day }],
    skipDuplicates: true,
  });
  if (!count) return 0;
  await prisma.user.update({ where: { id: userId }, data: { xp: { increment: g.amount } } });
  return g.amount;
}

async function checkAchievements(userId: string, streak: number): Promise<string[]> {
  const [have, user, completedLessons, attempts, reviewWins] = await Promise.all([
    prisma.userAchievement.findMany({ where: { userId }, select: { key: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { xp: true } }),
    prisma.progress.findMany({ where: { userId, completed: true }, select: { lesson: { select: { moduleId: true } } } }),
    prisma.blockAttempt.findMany({ where: { userId, passed: true }, select: { score: true, block: { select: { type: true } } } }),
    prisma.xpEvent.count({ where: { userId, reason: "REVIEW" } }),
  ]);
  const owned = new Set(have.map((a) => a.key));
  const earned: string[] = [];
  const add = (key: string, cond: boolean) => { if (cond && !owned.has(key)) earned.push(key); };

  add("first-lesson", completedLessons.length >= 1);
  add("five-lessons", completedLessons.length >= 5);
  add("perfect-quiz", attempts.some((a) => a.block.type === "QUIZ" && a.score === 100));
  add("bug-hunter", attempts.some((a) => a.block.type === "BUG_HUNT" && a.score === 100));
  add("first-code", attempts.some((a) => a.block.type === "CODE_EXERCISE"));
  add("reporter", attempts.some((a) => a.block.type === "BUG_REPORT_BUILDER"));
  add("api-explorer", attempts.some((a) => a.block.type === "API_PLAYGROUND"));
  add("streak-3", streak >= 3);
  add("streak-7", streak >= 7);
  add("streak-30", streak >= 30);
  add("reviewer", reviewWins >= 10);
  add("xp-500", user.xp >= 500);
  add("xp-2000", user.xp >= 2000);

  if (!owned.has("module-master") && completedLessons.length) {
    const doneByModule = new Map<string, number>();
    for (const p of completedLessons) doneByModule.set(p.lesson.moduleId, (doneByModule.get(p.lesson.moduleId) ?? 0) + 1);
    const totals = await prisma.lesson.groupBy({
      by: ["moduleId"],
      where: { published: true, moduleId: { in: [...doneByModule.keys()] } },
      _count: true,
    });
    add("module-master", totals.some((t) => t._count > 0 && (doneByModule.get(t.moduleId) ?? 0) >= t._count));
  }

  if (earned.length) {
    await prisma.userAchievement.createMany({ data: earned.map((key) => ({ userId, key })), skipDuplicates: true });
  }
  return earned;
}

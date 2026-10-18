/**
 * One-off: gives existing students the lesson XP they would have earned
 * for lessons completed before gamification existed. Safe to run again —
 * XpEvent (userId, reason, refId) is unique, so nothing is paid twice.
 *
 *   npx tsx scripts/backfill-xp.ts [--dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { LESSON_XP, dayKey } from "../src/lib/game";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

async function main() {
  const done = await prisma.progress.findMany({
    where: { completed: true, user: { role: "STUDENT" } },
    select: { userId: true, lessonId: true, completedAt: true, updatedAt: true },
  });
  console.log(`${done.length} bitmiş dərs tapıldı`);
  if (DRY) return;

  const res = await prisma.xpEvent.createMany({
    data: done.map((p) => ({
      userId: p.userId, amount: LESSON_XP, reason: "LESSON", refId: p.lessonId, day: dayKey(p.completedAt ?? p.updatedAt),
    })),
    skipDuplicates: true,
  });
  console.log(`${res.count} XP qeydi yaradıldı`);

  const totals = await prisma.xpEvent.groupBy({ by: ["userId"], _sum: { amount: true } });
  for (const t of totals) {
    await prisma.user.update({ where: { id: t.userId }, data: { xp: t._sum.amount ?? 0 } });
  }
  console.log(`${totals.length} tələbənin XP balansı yeniləndi`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

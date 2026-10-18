/**
 * Local development seed. Never run against production.
 *
 * Creates demo accounts and recreates the pre-restructure modules/lessons
 * (ids from content/_legacy/lessons-2026-10-18.json) so that
 * `npm run content:sync` can be tested exactly as it will run in production.
 *
 *   teacher@narix.local / narix123
 *   student@narix.local / narix123
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LegacyModule = {
  id: string; title: string; order: number; published: boolean; icon: string; coverColor: string; description: string | null;
  lessons: { id: string; slug: string; title: string; order: number; published: boolean; estimatedMinutes: number; quizEnabled: boolean; blocks: { type: string; title: string | null; content: string }[] }[];
};

async function main() {
  if (process.env.DATABASE_URL?.includes("neon.tech")) throw new Error("Seed is for local databases only.");

  const hash = await bcrypt.hash("narix123", 10);
  await prisma.user.upsert({ where: { email: "teacher@narix.local" }, update: {}, create: { email: "teacher@narix.local", name: "Demo Müəllim", role: "TEACHER", passwordHash: hash } });
  const student = await prisma.user.upsert({ where: { email: "student@narix.local" }, update: {}, create: { email: "student@narix.local", name: "Demo Tələbə", role: "STUDENT", passwordHash: hash } });

  const legacy: LegacyModule[] = JSON.parse(readFileSync(join(__dirname, "..", "content", "_legacy", "lessons-2026-10-18.json"), "utf8"));
  for (const m of legacy) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, title: m.title, order: m.order, published: m.published, icon: m.icon, coverColor: m.coverColor, description: m.description },
    });
    for (const l of m.lessons) {
      await prisma.lesson.upsert({
        where: { id: l.id },
        update: {},
        create: {
          id: l.id, slug: l.slug, title: l.title, order: l.order, published: l.published, moduleId: m.id,
          estimatedMinutes: l.estimatedMinutes, quizEnabled: l.quizEnabled,
          blocks: { create: l.blocks.map((b, i) => ({ type: b.type, title: b.title, content: b.content, order: i })) },
        },
      });
    }
  }

  // A little history for the demo student: the first two legacy lessons done.
  for (const lessonId of legacy[0].lessons.slice(0, 2).map((l) => l.id)) {
    await prisma.progress.upsert({
      where: { userId_lessonId: { userId: student.id, lessonId } },
      update: {},
      create: { userId: student.id, lessonId, completed: true, completedAt: new Date() },
    });
  }
  console.log("Seed hazırdır: teacher@narix.local / student@narix.local (şifrə: narix123)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

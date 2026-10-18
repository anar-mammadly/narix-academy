/**
 * Writes content/modules/*.json to the database.
 *
 *   npm run content:check   validate + print the plan, change nothing
 *   npm run content:sync    back up, then apply
 *
 * - Module and lesson ids are kept, so student progress stays attached.
 * - Blocks without an id get a stable id that is written back into the JSON
 *   file, so later syncs update blocks in place instead of recreating them
 *   (attempts, answers and review cards stay linked).
 * - Blocks that disappear from a file are deleted; lessons are never deleted.
 * - Modules that are no longer in any file are unpublished, not deleted.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { validateBlock } from "../src/lib/block-schema";

const DRY = process.argv.includes("--dry-run");
const root = join(__dirname, "..");
const dir = join(root, "content", "modules");
const prisma = new PrismaClient();

type FileBlock = { id?: string; type: string; title?: string | null; content: unknown; imageUrl?: string | null };
type FileLesson = {
  id?: string; slug: string; title: string; shortDescription?: string; estimatedMinutes?: number;
  minQuizScore?: number; published?: boolean; blocks: FileBlock[];
};
type FileModule = { id?: string; key: string; order: number; title: string; description?: string; icon?: string; color?: string; published?: boolean; lessons: FileLesson[] };

const newId = () => "c" + Date.now().toString(36) + randomBytes(8).toString("hex").slice(0, 12);

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const modules: { file: string; data: FileModule }[] = files.map((f) => ({ file: f, data: JSON.parse(readFileSync(join(dir, f), "utf8")) }));

  // ── Validate everything first ──
  const errors: string[] = [];
  const slugs = new Map<string, string>();
  for (const { file, data } of modules) {
    if (!data.id) errors.push(`${file}: modulun "id" sahəsi tələb olunur`);
    for (const l of data.lessons) {
      if (slugs.has(l.slug)) errors.push(`${file}: slug "${l.slug}" ${slugs.get(l.slug)} faylında da var`);
      slugs.set(l.slug, file);
      l.blocks.forEach((b, i) => {
        const r = validateBlock(b);
        if (!r.ok) errors.push(`${file} › ${l.slug} › #${i}: ${r.error}`);
      });
    }
  }
  const dbLessons = await prisma.lesson.findMany({ select: { id: true, slug: true } });
  const fileLessonIds = new Set(modules.flatMap((m) => m.data.lessons.map((l) => l.id).filter(Boolean)));
  for (const l of dbLessons) {
    const owner = slugs.get(l.slug);
    const fileLesson = owner && modules.find((m) => m.file === owner)!.data.lessons.find((x) => x.slug === l.slug);
    if (fileLesson && fileLesson.id && fileLesson.id !== l.id) errors.push(`slug "${l.slug}" bazada başqa dərsə (${l.id}) aiddir`);
  }
  for (const id of fileLessonIds) if (!dbLessons.some((l) => l.id === id)) errors.push(`dərs id ${id} bazada yoxdur`);
  if (errors.length) {
    console.error("Validasiya xətaları:\n" + errors.map((e) => "  - " + e).join("\n"));
    process.exit(1);
  }

  const notInFiles = dbLessons.filter((l) => !fileLessonIds.has(l.id) && !slugs.has(l.slug));
  const total = modules.reduce((s, m) => s + m.data.lessons.length, 0);
  const newLessons = modules.reduce((s, m) => s + m.data.lessons.filter((l) => !l.id && !dbLessons.some((d) => d.slug === l.slug)).length, 0);
  console.log(`${modules.length} modul, ${total} dərs (${newLessons} yeni). Faylda olmayan dərslər: ${notInFiles.length ? notInFiles.map((l) => l.slug).join(", ") : "yoxdur"}`);
  if (DRY) { console.log("Dry run — heç nə dəyişdirilmədi."); return; }

  // ── Backup ──
  const backupDir = join(root, "content", "_legacy");
  mkdirSync(backupDir, { recursive: true });
  const snapshot = await prisma.module.findMany({ include: { lessons: { include: { blocks: true } } } });
  const backupFile = join(backupDir, `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(backupFile, JSON.stringify(snapshot, null, 1));
  console.log(`Ehtiyat nüsxə: ${backupFile}`);

  // ── Assign stable ids and write them back to the files ──
  for (const m of modules) {
    let changed = false;
    for (const l of m.data.lessons) for (const b of l.blocks) if (!b.id) { b.id = newId(); changed = true; }
    if (changed) writeFileSync(join(dir, m.file), JSON.stringify(m.data, null, 2) + "\n");
  }

  // ── Apply ──
  for (const { data: m } of modules) {
    await prisma.module.update({
      where: { id: m.id! },
      data: {
        title: m.title, description: m.description ?? null, order: m.order,
        icon: m.icon ?? "BookOpen", coverColor: m.color ?? "#5b4bff", published: m.published ?? true,
      },
    });

    for (const [order, l] of m.lessons.entries()) {
      const existing = l.id
        ? await prisma.lesson.findUnique({ where: { id: l.id }, select: { id: true } })
        : await prisma.lesson.findUnique({ where: { slug: l.slug }, select: { id: true } });
      const hasQuiz = l.blocks.some((b) => b.type === "QUIZ");
      const lessonData = {
        title: l.title, slug: l.slug, shortDescription: l.shortDescription ?? null, moduleId: m.id!, order,
        estimatedMinutes: l.estimatedMinutes ?? 10, minQuizScore: l.minQuizScore ?? 70, quizEnabled: hasQuiz,
        published: l.published ?? true,
      };
      const lesson = existing
        ? await prisma.lesson.update({ where: { id: existing.id }, data: lessonData })
        : await prisma.lesson.create({ data: lessonData });

      const keep = l.blocks.map((b) => b.id!);
      const current = await prisma.lessonBlock.findMany({ where: { lessonId: lesson.id }, select: { id: true } });
      const currentIds = new Set(current.map((b) => b.id));

      await prisma.$transaction([
        prisma.lessonBlock.deleteMany({ where: { lessonId: lesson.id, id: { notIn: keep } } }),
        ...l.blocks.map((b, i) => {
          const r = validateBlock(b);
          if (!r.ok) throw new Error(r.error);
          const row = { type: b.type, title: b.title ?? null, content: JSON.stringify(r.block.content), imageUrl: b.imageUrl ?? null, order: i };
          return currentIds.has(b.id!)
            ? prisma.lessonBlock.update({ where: { id: b.id! }, data: { ...row, lessonId: lesson.id } })
            : prisma.lessonBlock.upsert({ where: { id: b.id! }, update: { ...row, lessonId: lesson.id }, create: { ...row, id: b.id!, lessonId: lesson.id } });
        }),
      ]);
      console.log(`  ✓ ${m.title} › ${l.title} (${l.blocks.length} blok)`);
    }
  }

  const usedModules = new Set(modules.map((m) => m.data.id));
  const orphanModules = await prisma.module.findMany({ where: { id: { notIn: [...usedModules] as string[] } }, include: { _count: { select: { lessons: true } } } });
  for (const om of orphanModules) {
    await prisma.module.update({ where: { id: om.id }, data: { published: false, order: 100 + om.order } });
    console.log(`  ○ "${om.title}" modulu gizlədildi (${om._count.lessons} dərs qalıb)`);
  }
  console.log("Hazırdır.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

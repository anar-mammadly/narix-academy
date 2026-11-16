import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { validateBlock } from "./block-schema";
import m01 from "../../content/modules/01-qa-giris.json";
import m02 from "../../content/modules/02-proses.json";
import m03 from "../../content/modules/03-telebler.json";
import m04 from "../../content/modules/04-seviyyeler-novler.json";
import m05 from "../../content/modules/05-test-dizayn.json";
import m06 from "../../content/modules/06-test-senedleri.json";
import m07 from "../../content/modules/07-baqlar.json";
import m08 from "../../content/modules/08-aletler.json";
import m09 from "../../content/modules/09-avtomatlasdirma.json";
import m10 from "../../content/modules/10-veb-esaslari.json";
import m11 from "../../content/modules/11-playwright-esaslari.json";
import m12 from "../../content/modules/12-playwright-framework.json";
import m13 from "../../content/modules/13-pesekar-avtomatlasdirma.json";

// Brings lessons from content/modules/*.json into the database from the admin
// panel, for when nobody can run `npm run content:sync` on a terminal.
//
// Unlike that script, this is additive only:
//   • modules are created or have their title, order, colour and track updated;
//   • lessons that are not in the database yet are created with their blocks;
//   • lessons that already exist are only moved to their module and position —
//     their text is NOT touched, so edits made in the lesson editor survive.

type FileBlock = { id?: string; type: string; title?: string | null; content: unknown; imageUrl?: string | null };
type FileLesson = { id?: string; slug: string; title: string; shortDescription?: string; estimatedMinutes?: number; minQuizScore?: number; published?: boolean; blocks: FileBlock[] };
type FileModule = { id: string; key: string; order: number; title: string; description?: string; icon?: string; color?: string; published?: boolean; track?: string; lessons: FileLesson[] };

const FILES = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, m13] as unknown as FileModule[];

const newId = () => "c" + Date.now().toString(36) + randomBytes(8).toString("hex").slice(0, 12);

export type CurriculumPlan = {
  fileModules: number;
  fileLessons: number;
  newModules: string[];
  newLessons: { module: string; title: string }[];
  /** existing lessons that will move to another module or position */
  moved: number;
  errors: string[];
};

async function inspect() {
  const [dbModules, dbLessons] = await Promise.all([
    prisma.module.findMany({ select: { id: true } }),
    prisma.lesson.findMany({ select: { id: true, slug: true, moduleId: true, order: true } }),
  ]);
  const moduleIds = new Set(dbModules.map((m) => m.id));
  const byId = new Map(dbLessons.map((l) => [l.id, l]));
  const bySlug = new Map(dbLessons.map((l) => [l.slug, l]));
  const find = (l: FileLesson) => (l.id && byId.get(l.id)) || bySlug.get(l.slug) || null;
  return { moduleIds, find };
}

export async function planCurriculum(): Promise<CurriculumPlan> {
  const { moduleIds, find } = await inspect();
  const plan: CurriculumPlan = { fileModules: FILES.length, fileLessons: 0, newModules: [], newLessons: [], moved: 0, errors: [] };
  const slugs = new Set<string>();
  for (const m of FILES) {
    if (!moduleIds.has(m.id)) plan.newModules.push(m.title);
    m.lessons.forEach((l, order) => {
      plan.fileLessons += 1;
      if (slugs.has(l.slug)) plan.errors.push(`"${l.slug}" iki dəfə təkrarlanır`);
      slugs.add(l.slug);
      const existing = find(l);
      if (!existing) {
        plan.newLessons.push({ module: m.title, title: l.title });
        l.blocks.forEach((b, i) => {
          const r = validateBlock(b);
          if (!r.ok) plan.errors.push(`${l.title} › blok ${i + 1}: ${r.error}`);
        });
      } else if (existing.moduleId !== m.id || existing.order !== order) {
        plan.moved += 1;
      }
    });
  }
  return plan;
}

export async function applyCurriculum() {
  const plan = await planCurriculum();
  if (plan.errors.length) return { ok: false as const, plan };
  const { find } = await inspect();
  let created = 0;

  for (const m of FILES) {
    const data = {
      title: m.title, description: m.description ?? null, order: m.order,
      icon: m.icon ?? "BookOpen", coverColor: m.color ?? "#5b4bff", published: m.published ?? true, track: m.track ?? "manual",
    };
    await prisma.module.upsert({ where: { id: m.id }, update: data, create: { id: m.id, ...data } });

    for (const [order, l] of m.lessons.entries()) {
      const existing = find(l);
      if (existing) {
        // place it; leave its content as the teacher has it
        if (existing.moduleId !== m.id || existing.order !== order) {
          await prisma.lesson.update({ where: { id: existing.id }, data: { moduleId: m.id, order } });
        }
        continue;
      }
      await prisma.lesson.create({
        data: {
          title: l.title, slug: l.slug, shortDescription: l.shortDescription ?? null, moduleId: m.id, order,
          estimatedMinutes: l.estimatedMinutes ?? 10, minQuizScore: l.minQuizScore ?? 70,
          quizEnabled: l.blocks.some((b) => b.type === "QUIZ"), published: l.published ?? true,
          blocks: {
            create: l.blocks.map((b, i) => {
              const r = validateBlock(b);
              if (!r.ok) throw new Error(r.error);
              return { id: b.id ?? newId(), type: b.type, title: b.title ?? null, content: JSON.stringify(r.block.content), imageUrl: b.imageUrl ?? null, order: i };
            }),
          },
        },
      });
      created += 1;
    }
  }
  return { ok: true as const, plan, created };
}

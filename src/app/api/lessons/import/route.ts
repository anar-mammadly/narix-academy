import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth";
import { slugify } from "@/server/lib/slugify";
import type { BlockType } from "@/shared/types/blocks";

const BLOCK_ENUM = [
  "HEADING",
  "TEXT",
  "IMAGE",
  "EXAMPLE",
  "TABLE",
  "QUIZ",
  "TASK",
  "NOTE",
  "DIVIDER",
] as const;

const headingSchema = z.object({
  text: z.string().min(1),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});

const textSchema = z.object({
  body: z.string(),
  highlight: z.enum(["normal", "info", "warning", "success"]).default("normal"),
});

const imageSchema = z.object({
  url: z.string().min(1),
  caption: z.string().default(""),
  alt: z.string().default(""),
  alignment: z.enum(["left", "center", "right"]).default("center"),
});

const exampleSchema = z.object({
  description: z.string().default(""),
  takeaway: z.string().default(""),
  relatedImageUrl: z.string().nullable().default(null),
});

const tableSchema = z.object({
  headers: z.array(z.string()).default([]),
  rows: z.array(z.array(z.string())).default([]),
});

const quizQuestionSchema = z.object({
  id: z.string().optional(),
  text: z.string().default(""),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).default([]),
});

const taskSchema = z.object({
  instructions: z.string().default(""),
  placeholder: z.string().default(""),
  required: z.boolean().default(false),
});

const noteSchema = z.object({
  variant: z.enum(["important", "remember", "tip", "warning"]).default("tip"),
  body: z.string().default(""),
});

const dividerSchema = z.record(z.never()).or(z.object({}));

const lessonSchema = z
  .object({
    title: z.string().optional(),
    slug: z.string().optional(),
    shortDescription: z.string().nullable(),
    estimatedMinutes: z.number().int().min(1).max(24 * 60),
    coverImageUrl: z.string().nullable(),
    published: z.boolean(),
    quizEnabled: z.boolean(),
    minQuizScore: z.number().int().min(0).max(100).nullable(),
  })
  .strict();

const blockInputSchema = z
  .object({
  type: z.enum(BLOCK_ENUM),
  title: z.string().nullable(),
  order: z.number().int(),
  content: z.unknown(),
  settings: z.unknown(),
  imageUrl: z.string().nullable(),
})
  .strict();

const payloadSchema = z
  .object({
  lesson: lessonSchema,
  blocks: z.array(blockInputSchema).min(1),
})
  .strict();

type NormalizedBlock = {
  type: BlockType;
  title: string | null;
  content: string;
  settings: string;
  imageUrl: string | null;
  order: number;
};

function parseSettings(raw: unknown): string {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return JSON.stringify(raw);
  }
  return JSON.stringify({});
}

function validateAndNormalizeContent(type: BlockType, content: unknown): string {
  switch (type) {
    case "HEADING":
      return JSON.stringify(headingSchema.parse(content));
    case "TEXT":
      return JSON.stringify(textSchema.parse(content));
    case "IMAGE":
      return JSON.stringify(imageSchema.parse(content));
    case "EXAMPLE":
      return JSON.stringify(exampleSchema.parse(content));
    case "TABLE":
      return JSON.stringify(tableSchema.parse(content));
    case "QUIZ": {
      const parsed = quizSchema.parse(content);
      const questions = parsed.questions.map((q) => ({
        ...q,
        id: q.id || crypto.randomUUID(),
        imageUrl: q.imageUrl ?? null,
      }));
      return JSON.stringify({ questions });
    }
    case "TASK":
      return JSON.stringify(taskSchema.parse(content));
    case "NOTE":
      return JSON.stringify(noteSchema.parse(content));
    case "DIVIDER":
      return JSON.stringify(dividerSchema.parse(content));
    default:
      return JSON.stringify({});
  }
}

function normalizeBlocks(blocks: z.infer<typeof blockInputSchema>[]): NormalizedBlock[] {
  const withOrder = blocks.map((b) => ({
    ...b,
    computedOrder: b.order,
  }));
  withOrder.sort((a, b) => a.computedOrder - b.computedOrder);
  return withOrder.map((b, idx) => ({
    type: b.type,
    title: b.title ?? null,
    content: validateAndNormalizeContent(b.type, b.content),
    settings: parseSettings(b.settings),
    imageUrl: b.imageUrl ?? null,
    order: idx,
  }));
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (await prisma.lesson.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const moduleId = searchParams.get("moduleId");
  const lessonTitleOverride = searchParams.get("lessonTitleOverride");
  if (mode !== "dryRun" && mode !== "commit") {
    return NextResponse.json({ error: "Mode düzgün deyil" }, { status: 400 });
  }
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId tələb olunur" }, { status: 400 });
  }

  const payload = parsed.data;
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) {
    return NextResponse.json({ error: "Modul tapılmadı" }, { status: 404 });
  }

  const override = lessonTitleOverride?.trim();
  const finalTitle = override || payload.lesson.title?.trim();
  if (!finalTitle) {
    return NextResponse.json({ error: "Dərs başlığı boş ola bilməz" }, { status: 400 });
  }

  const baseSlug = (payload.lesson.slug?.trim() || slugify(finalTitle)).trim();
  const slug = await uniqueSlug(baseSlug);

  const maxOrder = await prisma.lesson.aggregate({
    where: { moduleId },
    _max: { order: true },
  });
  const lessonOrder = (maxOrder._max.order ?? -1) + 1;

  let blocks: NormalizedBlock[];
  try {
    blocks = normalizeBlocks(payload.blocks);
  } catch {
    return NextResponse.json({ error: "Blok məzmunu formatı yanlışdır" }, { status: 400 });
  }

  const lessonData = {
    title: finalTitle,
    slug,
    shortDescription: payload.lesson.shortDescription,
    moduleId,
    order: lessonOrder,
    estimatedMinutes: payload.lesson.estimatedMinutes,
    coverImageUrl: payload.lesson.coverImageUrl,
    published: payload.lesson.published,
    quizEnabled: payload.lesson.quizEnabled,
    minQuizScore: payload.lesson.minQuizScore,
  };

  if (mode === "dryRun") {
    return NextResponse.json({
      ok: true,
      mode,
      preview: {
        module: { id: mod.id, title: mod.title },
        lesson: lessonData,
        blocks: blocks.map((b) => ({
          type: b.type,
          title: b.title,
          order: b.order,
          imageUrl: b.imageUrl,
          content: JSON.parse(b.content),
        })),
        totals: { blockCount: blocks.length },
      },
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.create({ data: lessonData });
    await tx.lessonBlock.createMany({
      data: blocks.map((b) => ({
        lessonId: lesson.id,
        type: b.type,
        title: b.title,
        content: b.content,
        settings: b.settings,
        imageUrl: b.imageUrl,
        order: b.order,
      })),
    });
    return lesson;
  });

  return NextResponse.json({
    ok: true,
    mode,
    lesson: created,
    importedBlocks: blocks.length,
  });
}

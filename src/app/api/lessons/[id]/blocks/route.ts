import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth";
import { defaultContentForType } from "@/server/lib/block-defaults";
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

const addSchema = z.object({
  type: z.enum(BLOCK_ENUM),
  afterOrder: z.number().int().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  // Next.js route handler typing differs across versions (params may be a Promise in newer Next).
  const p = (params as unknown) as { id: string } | Promise<{ id: string }>;
  const { id } = await p;
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
  const parsed = addSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "desc" }, take: 1 } },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Dərs tapılmadı" }, { status: 404 });
  }
  const type = parsed.data.type as BlockType;
  const defaults = defaultContentForType(type);
  let insertOrder: number;
  if (typeof parsed.data.afterOrder === "number") {
    insertOrder = parsed.data.afterOrder + 1;
    await prisma.lessonBlock.updateMany({
      where: { lessonId: id, order: { gte: insertOrder } },
      data: { order: { increment: 1 } },
    });
  } else {
    insertOrder = (lesson.blocks[0]?.order ?? -1) + 1;
  }
  const block = await prisma.lessonBlock.create({
    data: {
      lessonId: id,
      type,
      title: defaults.title,
      content: defaults.content,
      settings: defaults.settings,
      imageUrl: null,
      order: insertOrder,
    },
  });
  return NextResponse.json({ block });
}

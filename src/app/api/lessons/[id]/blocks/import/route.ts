import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail, lessonBlocks, prepareBlock, requireLesson } from "../../../_lib";

type Ctx = { params: Promise<{ id: string }> };

const MAX_BLOCKS = 300;

const importSchema = z.object({
  mode: z.enum(["append", "replace"]),
  blocks: z
    .array(z.object({ type: z.unknown(), title: z.unknown().optional(), content: z.unknown().optional(), imageUrl: z.unknown().optional() }).passthrough())
    .min(1, "İdxal üçün ən az bir blok lazımdır")
    .max(MAX_BLOCKS, `Bir dəfəyə ən çox ${MAX_BLOCKS} blok idxal etmək olar`),
});

/**
 * Bulk import. Every block is validated first; nothing is written unless all pass.
 * "replace" deletes the lesson's existing blocks (and with them student answers) in the same transaction.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    await requireLesson(id);
    const { mode, blocks } = importSchema.parse(await req.json());

    const errors: { index: number; error: string }[] = [];
    const prepared = blocks.flatMap((raw, index) => {
      try {
        return [prepareBlock(raw, `#${index + 1}`)];
      } catch (e) {
        errors.push({ index, error: e instanceof Error ? e.message : "Yanlış blok" });
        return [];
      }
    });
    if (errors.length) {
      return NextResponse.json({ error: `${errors.length} blok yoxlamadan keçmədi`, errors }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      let start = 0;
      if (mode === "replace") {
        await tx.lessonBlock.deleteMany({ where: { lessonId: id } });
      } else {
        const last = await tx.lessonBlock.findFirst({ where: { lessonId: id }, orderBy: { order: "desc" }, select: { order: true } });
        start = (last?.order ?? -1) + 1;
      }
      const created = await tx.lessonBlock.createMany({
        data: prepared.map((b, i) => ({ ...b, lessonId: id, order: start + i })),
      });
      if (created.count !== prepared.length) throw new HttpError(500, "Bloklar tam yazılmadı");
    });

    return NextResponse.json({ imported: prepared.length, blocks: await lessonBlocks(id) }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

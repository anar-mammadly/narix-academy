import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail, lessonBlocks, prepareBlock, requireLesson, serializeBlock } from "../../_lib";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  type: z.string(),
  title: z.string().max(200).nullish(),
  content: z.unknown().optional(),
  imageUrl: z.string().nullish(),
  /** Insert right after this block; appended to the end when omitted. */
  afterId: z.string().nullish(),
});

const reorderSchema = z.object({
  order: z.array(z.string().min(1)).min(1, "Sıralama boşdur"),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    await requireLesson(id);
    return NextResponse.json(await lessonBlocks(id));
  } catch (e) {
    return fail(e);
  }
}

/** Create one block (validated with validateBlock). */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    await requireLesson(id);
    const body = createSchema.parse(await req.json());
    const data = prepareBlock(body);

    const block = await prisma.$transaction(async (tx) => {
      let order: number;
      if (body.afterId) {
        const after = await tx.lessonBlock.findUnique({ where: { id: body.afterId }, select: { lessonId: true, order: true } });
        if (!after || after.lessonId !== id) throw new HttpError(404, "Blok bu dərsdə tapılmadı");
        await tx.lessonBlock.updateMany({ where: { lessonId: id, order: { gt: after.order } }, data: { order: { increment: 1 } } });
        order = after.order + 1;
      } else {
        const last = await tx.lessonBlock.findFirst({ where: { lessonId: id }, orderBy: { order: "desc" }, select: { order: true } });
        order = (last?.order ?? -1) + 1;
      }
      return tx.lessonBlock.create({ data: { ...data, lessonId: id, order } });
    });

    return NextResponse.json(serializeBlock(block), { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

/** Bulk reorder: { order: [blockId, …] } must list every block of the lesson exactly once. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    await requireLesson(id);
    const { order } = reorderSchema.parse(await req.json());

    const existing = await prisma.lessonBlock.findMany({ where: { lessonId: id }, select: { id: true } });
    const ids = new Set(existing.map((b) => b.id));
    const unique = new Set(order);
    if (unique.size !== order.length) throw new HttpError(400, "Sıralamada təkrarlanan blok var");
    if (order.length !== ids.size || order.some((b) => !ids.has(b))) {
      throw new HttpError(409, "Blok siyahısı köhnəlib. Səhifəni yeniləyin.");
    }

    await prisma.$transaction(order.map((blockId, index) => prisma.lessonBlock.update({ where: { id: blockId }, data: { order: index } })));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

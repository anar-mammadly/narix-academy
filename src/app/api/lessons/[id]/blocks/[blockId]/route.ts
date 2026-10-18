import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { fail, prepareBlock, requireBlockInLesson, serializeBlock } from "../../../_lib";

type Ctx = { params: Promise<{ id: string; blockId: string }> };

const patchSchema = z
  .object({
    title: z.string().max(200).nullable(),
    content: z.unknown(),
    imageUrl: z.string().nullable(),
  })
  .partial()
  .strict();

/** Update a block's title/content. The type never changes; content is re-validated. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id, blockId } = await params;
    const body = patchSchema.parse(await req.json());
    const block = await requireBlockInLesson(id, blockId);

    const data = prepareBlock({
      type: block.type,
      title: body.title !== undefined ? body.title : block.title,
      content: body.content !== undefined ? body.content : block.content,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : block.imageUrl,
    });

    const updated = await prisma.lessonBlock.update({
      where: { id: blockId },
      data: { title: data.title, content: data.content, imageUrl: data.imageUrl },
    });
    return NextResponse.json(serializeBlock(updated));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id, blockId } = await params;
    await requireBlockInLesson(id, blockId);
    await prisma.lessonBlock.delete({ where: { id: blockId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

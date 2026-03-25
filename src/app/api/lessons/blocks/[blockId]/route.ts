import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { pruneUndefined } from "@/lib/prune";
const patchSchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().optional(),
  settings: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  type: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { blockId: string } | Promise<{ blockId: string }> }
) {
  const p = (params as unknown) as { blockId: string } | Promise<{ blockId: string }>;
  const { blockId } = await p;
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
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const data = pruneUndefined(parsed.data as Record<string, unknown>);
  const block = await prisma.lessonBlock.update({
    where: { id: blockId },
    data,
  });
  return NextResponse.json({ block });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { blockId: string } | Promise<{ blockId: string }> }
) {
  const p = (params as unknown) as { blockId: string } | Promise<{ blockId: string }>;
  const { blockId } = await p;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  await prisma.lessonBlock.deleteMany({ where: { id: blockId } });
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: Request,
  { params }: { params: { blockId: string } | Promise<{ blockId: string }> }
) {
  const p = (params as unknown) as { blockId: string } | Promise<{ blockId: string }>;
  const { blockId } = await p;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const intent = req.headers.get("x-action");
  if (intent !== "duplicate") {
    return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });
  }
  const src = await prisma.lessonBlock.findUnique({ where: { id: blockId } });
  if (!src) {
    return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  }
  await prisma.lessonBlock.updateMany({
    where: { lessonId: src.lessonId, order: { gt: src.order } },
    data: { order: { increment: 1 } },
  });
  const block = await prisma.lessonBlock.create({
    data: {
      lessonId: src.lessonId,
      type: src.type,
      title: src.title,
      content: src.content,
      settings: src.settings,
      imageUrl: src.imageUrl,
      order: src.order + 1,
    },
  });
  return NextResponse.json({ block });
}

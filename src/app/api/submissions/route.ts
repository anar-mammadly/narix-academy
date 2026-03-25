import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const list = await prisma.submission.findMany({
    where: {
      ...(lessonId ? { lessonId } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      lesson: { select: { id: true, title: true, slug: true } },
      block: { select: { id: true, title: true, type: true } },
    },
    take: 200,
  });
  return NextResponse.json({ submissions: list });
}

const submitSchema = z.object({
  blockId: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Yalnız tələbələr" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON" }, { status: 400 });
  }
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const block = await prisma.lessonBlock.findUnique({
    where: { id: parsed.data.blockId },
    include: { lesson: true },
  });
  if (!block || block.type !== "TASK") {
    return NextResponse.json({ error: "Tapşırıq bloku tapılmadı" }, { status: 404 });
  }
  const accessible = await prisma.lesson.findFirst({
    where: {
      id: block.lessonId,
      published: true,
      contentVisibility: { none: { studentId: session.userId, visible: false } },
      module: {
        id: block.lesson.moduleId,
        published: true,
        contentVisibility: {
          none: { studentId: session.userId, visible: false, lessonId: null },
        },
      },
    },
    select: { id: true },
  });
  if (!block.lesson.published || !accessible) {
    return NextResponse.json({ error: "Dərs əlçatan deyil" }, { status: 403 });
  }
  const sub = await prisma.submission.upsert({
    where: {
      userId_blockId: { userId: session.userId, blockId: block.id },
    },
    create: {
      userId: session.userId,
      lessonId: block.lessonId,
      blockId: block.id,
      answer: parsed.data.answer,
    },
    update: { answer: parsed.data.answer },
  });
  return NextResponse.json({ submission: sub });
}

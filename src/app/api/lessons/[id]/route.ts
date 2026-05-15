import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } }, module: true },
  });
  if (!lesson) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  return NextResponse.json(lesson);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = await req.json();
    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title: body.title,
        titleEn: body.titleEn,
        shortDescription: body.shortDescription,
        shortDescriptionEn: body.shortDescriptionEn,
        estimatedMinutes: body.estimatedMinutes,
        published: body.published,
        quizEnabled: body.quizEnabled,
        minQuizScore: body.minQuizScore,
        coverImageUrl: body.coverImageUrl,
      },
    });
    return NextResponse.json(lesson);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await params;
    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId");
  const lessons = await prisma.lesson.findMany({
    where: moduleId ? { moduleId } : undefined,
    include: { module: { select: { title: true } }, blocks: { orderBy: { order: "asc" } } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
  });
  return NextResponse.json(lessons);
}

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = await req.json();
    const last = await prisma.lesson.findFirst({ where: { moduleId: body.moduleId }, orderBy: { order: "desc" } });
    let slug = slugify(body.title);
    // Ensure unique slug
    const existing = await prisma.lesson.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        titleEn: body.titleEn ?? null,
        slug,
        shortDescription: body.shortDescription ?? null,
        moduleId: body.moduleId,
        estimatedMinutes: body.estimatedMinutes ?? 30,
        published: body.published ?? false,
        quizEnabled: body.quizEnabled ?? false,
        minQuizScore: body.minQuizScore ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

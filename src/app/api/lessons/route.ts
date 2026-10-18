import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { fail, uniqueSlug } from "./_lib";

const createSchema = z.object({
  moduleId: z.string().min(1, "Modul seçilməyib"),
  title: z.string().trim().min(1, "Başlıq tələb olunur").max(200),
  titleEn: z.string().trim().max(200).nullish(),
  shortDescription: z.string().trim().max(500).nullish(),
  estimatedMinutes: z.number().int().min(1).max(600).optional(),
  published: z.boolean().optional(),
  quizEnabled: z.boolean().optional(),
  minQuizScore: z.number().int().min(0).max(100).nullish(),
});

export async function GET(req: NextRequest) {
  try {
    await requireTeacher();
    const moduleId = req.nextUrl.searchParams.get("moduleId");
    const lessons = await prisma.lesson.findMany({
      where: moduleId ? { moduleId } : undefined,
      include: { module: { select: { title: true } }, _count: { select: { blocks: true } } },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    });
    return NextResponse.json(lessons);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = createSchema.parse(await req.json());
    const mod = await prisma.module.findUnique({ where: { id: body.moduleId }, select: { id: true } });
    if (!mod) return NextResponse.json({ error: "Modul tapılmadı" }, { status: 404 });

    const last = await prisma.lesson.findFirst({ where: { moduleId: body.moduleId }, orderBy: { order: "desc" }, select: { order: true } });
    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        titleEn: body.titleEn || null,
        slug: await uniqueSlug(body.title),
        shortDescription: body.shortDescription || null,
        moduleId: body.moduleId,
        estimatedMinutes: body.estimatedMinutes ?? 30,
        published: body.published ?? false,
        quizEnabled: body.quizEnabled ?? false,
        minQuizScore: body.minQuizScore ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json({ ...lesson, _count: { blocks: 0 } }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

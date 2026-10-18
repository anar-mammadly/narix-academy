import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail, lessonBlocks, requireLesson } from "../_lib";

type Ctx = { params: Promise<{ id: string }> };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const patchSchema = z
  .object({
    title: z.string().trim().min(1, "Başlıq tələb olunur").max(200),
    titleEn: z.string().trim().max(200).nullable(),
    slug: z.string().trim().min(1, "Slug tələb olunur").max(120).regex(SLUG, "Slug yalnız kiçik latın hərfləri, rəqəm və “-” ola bilər"),
    shortDescription: z.string().trim().max(500).nullable(),
    shortDescriptionEn: z.string().trim().max(500).nullable(),
    estimatedMinutes: z.number().int().min(1, "Müddət ən az 1 dəqiqədir").max(600, "Müddət 600 dəqiqədən çox ola bilməz"),
    published: z.boolean(),
    quizEnabled: z.boolean(),
    minQuizScore: z.number().int().min(0, "Keçid balı 0–100 arasında olmalıdır").max(100, "Keçid balı 0–100 arasında olmalıdır").nullable(),
    coverImageUrl: z.string().trim().max(2000).nullable(),
    moduleId: z.string().min(1),
  })
  .partial()
  .strict();

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({ where: { id }, include: { module: { select: { id: true, title: true } } } });
    if (!lesson) throw new HttpError(404, "Dərs tapılmadı");
    return NextResponse.json({ ...lesson, blocks: await lessonBlocks(id) });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const current = await requireLesson(id);

    if (body.slug) {
      const clash = await prisma.lesson.findFirst({ where: { slug: body.slug, id: { not: id } }, select: { id: true } });
      if (clash) throw new HttpError(409, "Bu slug artıq başqa dərsdə istifadə olunur");
    }

    let order: number | undefined;
    if (body.moduleId && body.moduleId !== current.moduleId) {
      const mod = await prisma.module.findUnique({ where: { id: body.moduleId }, select: { id: true } });
      if (!mod) throw new HttpError(404, "Modul tapılmadı");
      // Moving to another module puts the lesson at the end of it.
      const last = await prisma.lesson.findFirst({ where: { moduleId: body.moduleId }, orderBy: { order: "desc" }, select: { order: true } });
      order = (last?.order ?? -1) + 1;
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...body,
        ...(body.titleEn !== undefined ? { titleEn: body.titleEn || null } : {}),
        ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription || null } : {}),
        ...(body.shortDescriptionEn !== undefined ? { shortDescriptionEn: body.shortDescriptionEn || null } : {}),
        ...(body.coverImageUrl !== undefined ? { coverImageUrl: body.coverImageUrl || null } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });
    return NextResponse.json(lesson);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    await requireLesson(id);
    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

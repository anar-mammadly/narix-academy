import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

const createSchema = z.object({
  lessonId: z.string().min(1, "Dərs seçilməyib"),
  title: z.string().trim().min(1, "Başlıq tələb olunur").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  dueDate: z
    .string()
    .nullish()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Son tarix düzgün deyil"),
});

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = createSchema.parse(await req.json());
    const lesson = await prisma.lesson.findUnique({ where: { id: body.lessonId }, select: { id: true, title: true } });
    if (!lesson) throw new HttpError(404, "Dərs tapılmadı");
    const hw = await prisma.homework.create({
      data: { lessonId: body.lessonId, title: body.title, description: body.description, dueDate: body.dueDate },
    });
    return NextResponse.json({ ...hw, lesson: { title: lesson.title }, submits: [] }, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

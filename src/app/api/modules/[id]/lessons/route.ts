import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

type Ctx = { params: Promise<{ id: string }> };

const reorderSchema = z.object({ order: z.array(z.string().min(1)).min(1, "Sıralama boşdur") });

/** Bulk reorder of a module's lessons: { order: [lessonId, …] } in one transaction. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const { order } = reorderSchema.parse(await req.json());
    const existing = await prisma.lesson.findMany({ where: { moduleId: id }, select: { id: true } });
    if (!existing.length) throw new HttpError(404, "Modulda dərs tapılmadı");
    const ids = new Set(existing.map((l) => l.id));
    if (new Set(order).size !== order.length || order.length !== ids.size || order.some((l) => !ids.has(l))) {
      throw new HttpError(409, "Dərs siyahısı köhnəlib. Səhifəni yeniləyin.");
    }
    await prisma.$transaction(order.map((lessonId, index) => prisma.lesson.update({ where: { id: lessonId }, data: { order: index } })));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

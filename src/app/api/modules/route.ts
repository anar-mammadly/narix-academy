import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";
import { moduleFields } from "./schema";

const reorderSchema = z.object({ order: z.array(z.string().min(1)).min(1) });

export async function GET() {
  try {
    await requireTeacher();
    const modules = await prisma.module.findMany({
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(modules);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = moduleFields.parse(await req.json());
    const last = await prisma.module.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const mod = await prisma.module.create({
      data: {
        title: body.title,
        titleEn: body.titleEn || null,
        description: body.description || null,
        descriptionEn: body.descriptionEn || null,
        published: body.published ?? false,
        ...(body.icon ? { icon: body.icon } : {}),
        ...(body.coverColor ? { coverColor: body.coverColor } : {}),
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(mod, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

/** Bulk reorder of modules: { order: [moduleId, …] } listing every module once. */
export async function PATCH(req: NextRequest) {
  try {
    await requireTeacher();
    const { order } = reorderSchema.parse(await req.json());
    const existing = await prisma.module.findMany({ select: { id: true } });
    const ids = new Set(existing.map((m) => m.id));
    if (new Set(order).size !== order.length || order.length !== ids.size || order.some((m) => !ids.has(m))) {
      throw new HttpError(409, "Modul siyahısı köhnəlib. Səhifəni yeniləyin.");
    }
    await prisma.$transaction(order.map((id, index) => prisma.module.update({ where: { id }, data: { order: index } })));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

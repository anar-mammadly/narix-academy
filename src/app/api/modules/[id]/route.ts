import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";
import { moduleFields } from "../schema";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = moduleFields.partial().strict();

async function requireModule(id: string) {
  const mod = await prisma.module.findUnique({ where: { id }, select: { id: true } });
  if (!mod) throw new HttpError(404, "Modul tapılmadı");
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const mod = await prisma.module.findUnique({ where: { id }, include: { lessons: { orderBy: { order: "asc" } } } });
    if (!mod) throw new HttpError(404, "Modul tapılmadı");
    return NextResponse.json(mod);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    await requireModule(id);
    const mod = await prisma.module.update({
      where: { id },
      data: {
        ...body,
        ...(body.titleEn !== undefined ? { titleEn: body.titleEn || null } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.descriptionEn !== undefined ? { descriptionEn: body.descriptionEn || null } : {}),
      },
    });
    return NextResponse.json(mod);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    await requireModule(id);
    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

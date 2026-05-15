import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = await prisma.module.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!mod) return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  return NextResponse.json(mod);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = await req.json();
    const mod = await prisma.module.update({
      where: { id },
      data: {
        title: body.title,
        titleEn: body.titleEn ?? null,
        description: body.description ?? null,
        descriptionEn: body.descriptionEn ?? null,
        published: body.published,
      },
    });
    return NextResponse.json(mod);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await params;
    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

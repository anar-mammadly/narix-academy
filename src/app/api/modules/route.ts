import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function GET() {
  const modules = await prisma.module.findMany({
    include: { lessons: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(modules);
}

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const body = await req.json();
    const last = await prisma.module.findFirst({ orderBy: { order: "desc" } });
    const mod = await prisma.module.create({
      data: {
        title: body.title,
        titleEn: body.titleEn ?? null,
        description: body.description ?? null,
        descriptionEn: body.descriptionEn ?? null,
        published: body.published ?? false,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(mod, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

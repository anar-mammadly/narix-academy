import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blocks = await prisma.lessonBlock.findMany({
    where: { lessonId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = await req.json();
    const last = await prisma.lessonBlock.findFirst({ where: { lessonId: id }, orderBy: { order: "desc" } });
    const block = await prisma.lessonBlock.create({
      data: {
        lessonId: id,
        type: body.type,
        title: body.title ?? null,
        content: body.content ?? "{}",
        settings: body.settings ?? "{}",
        imageUrl: body.imageUrl ?? null,
        order: (last?.order ?? -1) + 1,
      },
    });
    return NextResponse.json(block, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

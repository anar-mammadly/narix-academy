import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ blockId: string }> }) {
  try {
    await requireTeacher();
    const { blockId } = await params;
    const body = await req.json();
    const block = await prisma.lessonBlock.update({
      where: { id: blockId },
      data: {
        title: body.title,
        content: body.content,
        settings: body.settings,
        imageUrl: body.imageUrl,
        order: body.order,
      },
    });
    return NextResponse.json(block);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ blockId: string }> }) {
  try {
    await requireTeacher();
    const { blockId } = await params;
    await prisma.lessonBlock.delete({ where: { id: blockId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacher();
    const { id } = await params;
    const ev = await prisma.calendarEvent.findUnique({ where: { id }, select: { id: true } });
    if (!ev) throw new HttpError(404, "Tədbir tapılmadı");
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

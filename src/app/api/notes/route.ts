import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { canSeeLesson } from "@/lib/access";

const SaveBody = z.object({
  lessonId: z.string().min(1).max(64),
  content: z.string().max(20000),
});

const DeleteQuery = z.object({ id: z.string().min(1).max(64) });

/** Create or update the caller's note for a lesson. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lessonId, content } = SaveBody.parse(await req.json());

    const existing = await prisma.note.findUnique({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      select: { id: true },
    });

    // New notes only on lessons the student can actually open.
    if (!existing) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, moduleId: true, published: true } });
      const allowed = lesson && (session.role === "TEACHER" || (await canSeeLesson(session.userId, lesson)));
      if (!allowed) return NextResponse.json({ error: "Dərs tapılmadı" }, { status: 404 });
    }

    const note = await prisma.note.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: { content },
      create: { userId: session.userId, lessonId, content },
      select: { id: true, lessonId: true, content: true, updatedAt: true },
    });
    return NextResponse.json(note);
  } catch (e) {
    return apiError(e);
  }
}

/** Delete one of the caller's notes: DELETE /api/notes?id=… */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession();
    const { id } = DeleteQuery.parse({ id: req.nextUrl.searchParams.get("id") ?? "" });
    const { count } = await prisma.note.deleteMany({ where: { id, userId: session.userId } });
    if (count === 0) return NextResponse.json({ error: "Qeyd tapılmadı" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

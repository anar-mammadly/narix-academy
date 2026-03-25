import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth";
import { canStudentCompleteLesson } from "@/server/lib/lesson-completion";

const schema = z.object({
  lessonId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Yalnız tələbələr" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const { lessonId } = parsed.data;
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      published: true,
      contentVisibility: { none: { studentId: session.userId, visible: false } },
      module: {
        published: true,
        contentVisibility: {
          none: { studentId: session.userId, visible: false, lessonId: null },
        },
      },
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Dərs əlçatan deyil" }, { status: 404 });
  }
  const check = await canStudentCompleteLesson(session.userId, lessonId);
  if (!check.ok) {
    return NextResponse.json({ error: "Şərtlər tamamlanmayıb", reasons: check.reasons }, { status: 400 });
  }
  const progress = await prisma.progress.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    create: {
      userId: session.userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      completedAt: new Date(),
    },
  });
  return NextResponse.json({ progress });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { canSeeLesson } from "@/lib/access";

const Body = z.object({
  homeworkId: z.string().min(1).max(64),
  content: z.string().trim().min(1, "Cavab boş ola bilməz").max(20000),
});

/** Student submits (or edits, until graded) their homework answer. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.role !== "STUDENT") throw new Error("Forbidden");
    const { homeworkId, content } = Body.parse(await req.json());

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: { id: true, lesson: { select: { id: true, moduleId: true, published: true } } },
    });
    if (!homework || !(await canSeeLesson(session.userId, homework.lesson))) {
      return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });
    }

    const existing = await prisma.homeworkSubmit.findUnique({
      where: { homeworkId_userId: { homeworkId, userId: session.userId } },
      select: { status: true },
    });
    if (existing?.status === "GRADED") {
      return NextResponse.json({ error: "Qiymətləndirilmiş cavabı dəyişmək olmaz" }, { status: 409 });
    }

    const sub = await prisma.homeworkSubmit.upsert({
      where: { homeworkId_userId: { homeworkId, userId: session.userId } },
      update: { content, status: "SUBMITTED", submittedAt: new Date() },
      create: { homeworkId, userId: session.userId, content },
      select: { id: true, content: true, status: true, grade: true, feedback: true, submittedAt: true },
    });
    return NextResponse.json(sub);
  } catch (e) {
    return apiError(e);
  }
}

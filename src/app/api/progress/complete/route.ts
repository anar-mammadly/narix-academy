import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { canSeeLesson } from "@/lib/access";
import { DEFAULT_PASS_MARK } from "@/lib/grading";
import { LESSON_XP, PERFECT_QUIZ_XP } from "@/lib/game";
import { reward } from "@/lib/game-server";

const Body = z.object({ lessonId: z.string().min(1) });

// A lesson with quizzes is complete only once its final quiz is passed.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lessonId } = Body.parse(await req.json());

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { blocks: { where: { type: "QUIZ" }, orderBy: { order: "asc" }, select: { id: true } } },
    });
    if (!lesson || !(await canSeeLesson(session.userId, lesson))) {
      return NextResponse.json({ error: "Dərs tapılmadı" }, { status: 404 });
    }

    const passMark = lesson.minQuizScore ?? DEFAULT_PASS_MARK;
    const quizIds = lesson.blocks.map((b) => b.id);
    const attempts = quizIds.length
      ? await prisma.blockAttempt.findMany({ where: { userId: session.userId, blockId: { in: quizIds } } })
      : [];
    const finalQuiz = quizIds.at(-1);
    const finalAttempt = attempts.find((a) => a.blockId === finalQuiz);

    if (finalQuiz && (!finalAttempt || finalAttempt.score < passMark)) {
      return NextResponse.json(
        { error: `Dərsi bitirmək üçün yekun quizdən ən az ${passMark}% topla.` },
        { status: 409 }
      );
    }

    await prisma.progress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: {
        completed: true,
        completedAt: new Date(),
        ...(finalAttempt ? { quizScore: finalAttempt.score, quizPassed: true, quizAttempts: finalAttempt.attempts } : {}),
      },
      create: {
        userId: session.userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
        ...(finalAttempt ? { quizScore: finalAttempt.score, quizPassed: true, quizAttempts: finalAttempt.attempts } : {}),
      },
    });

    const perfect = attempts.length > 0 && attempts.length === quizIds.length && attempts.every((a) => a.score === 100);
    const result = await reward(session.userId, [
      { amount: LESSON_XP, reason: "LESSON", refId: lessonId },
      ...(perfect ? [{ amount: PERFECT_QUIZ_XP, reason: "PERFECT_QUIZ", refId: lessonId }] : []),
    ]);

    return NextResponse.json({ completed: true, reward: result });
  } catch (e) {
    return apiError(e);
  }
}

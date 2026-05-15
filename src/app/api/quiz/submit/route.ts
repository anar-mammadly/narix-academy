import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { parseJson } from "@/types/blocks";
import type { QuizContent } from "@/types/blocks";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lessonId, answers } = await req.json();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { blocks: { where: { type: "QUIZ" } } },
    });
    if (!lesson) return NextResponse.json({ error: "Dərs tapılmadı" }, { status: 404 });

    const quizBlock = lesson.blocks[0];
    if (!quizBlock) return NextResponse.json({ error: "Quiz yoxdur" }, { status: 400 });

    const quiz = parseJson<QuizContent>(quizBlock.content, { questions: [] });
    let correct = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }
    const score = quiz.questions.length > 0 ? Math.round((correct / quiz.questions.length) * 100) : 0;
    const passed = lesson.minQuizScore ? score >= lesson.minQuizScore : score >= 60;

    await prisma.progress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: { quizScore: score, quizPassed: passed, quizAttempts: { increment: 1 }, ...(passed ? { completed: true, completedAt: new Date() } : {}) },
      create: { userId: session.userId, lessonId, quizScore: score, quizPassed: passed, quizAttempts: 1, completed: passed, completedAt: passed ? new Date() : null },
    });

    return NextResponse.json({ score, passed, correct, total: quiz.questions.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

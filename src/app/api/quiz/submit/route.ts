import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth";
import { parseJson, type QuizContent } from "@/shared/types/blocks";

const schema = z.object({
  lessonId: z.string().min(1),
  blockId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
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
  const { lessonId, blockId, answers } = parsed.data;
  const block = await prisma.lessonBlock.findFirst({
    where: { id: blockId, lessonId, type: "QUIZ" },
  });
  if (!block) {
    return NextResponse.json({ error: "Test bloku tapılmadı" }, { status: 404 });
  }
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
  const quiz = parseJson<QuizContent>(block.content, { questions: [] });
  const questions = quiz.questions ?? [];
  let correct = 0;
  const details: {
    questionId: string;
    selected: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation?: string;
  }[] = [];
  for (const q of questions) {
    const sel = answers[q.id];
    const selected = typeof sel === "number" ? sel : -1;
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correct += 1;
    details.push({
      questionId: q.id,
      selected,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    });
  }
  const total = questions.length || 1;
  const score = Math.round((correct / total) * 100);
  const min = lesson.minQuizScore;
  const passed = min == null || score >= min;

  await prisma.progress.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    create: {
      userId: session.userId,
      lessonId,
      quizScore: score,
      quizAttempts: 1,
      quizPassed: passed,
    },
    update: {
      quizScore: score,
      quizAttempts: { increment: 1 },
      quizPassed: passed,
    },
  });

  return NextResponse.json({ score, correct, total: questions.length, passed, details });
}

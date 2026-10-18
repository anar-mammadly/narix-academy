import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { REVIEW_INTERVALS, REVIEW_XP } from "@/lib/game";
import { reward } from "@/lib/game-server";
import { parseJson, type QuizContent } from "@/types/blocks";

const Body = z.object({ itemId: z.string().min(1), answerIndex: z.number().int().min(0) });

// Leitner step: correct → next box (removed after box 5), wrong → back to box 1 tomorrow.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { itemId, answerIndex } = Body.parse(await req.json());

    const item = await prisma.reviewItem.findFirst({ where: { id: itemId, userId: session.userId }, include: { block: true } });
    if (!item) return NextResponse.json({ error: "Kart tapılmadı" }, { status: 404 });

    const quiz = parseJson<QuizContent>(item.block.content, { questions: [] });
    const question = quiz.questions.find((q) => q.id === item.questionId);
    if (!question) {
      await prisma.reviewItem.delete({ where: { id: item.id } });
      return NextResponse.json({ correct: false, removed: true });
    }

    const correct = question.correctIndex === answerIndex;
    const day = 24 * 60 * 60 * 1000;
    if (correct && item.box >= 5) {
      await prisma.reviewItem.delete({ where: { id: item.id } });
    } else {
      const box = correct ? item.box + 1 : 1;
      await prisma.reviewItem.update({
        where: { id: item.id },
        data: { box, dueAt: new Date(Date.now() + Math.max(1, REVIEW_INTERVALS[box]) * day) },
      });
    }

    const result = correct
      ? await reward(session.userId, [{ amount: REVIEW_XP, reason: "REVIEW", refId: `${item.id}-${item.box}` }])
      : null;

    return NextResponse.json({ correct, correctIndex: question.correctIndex, explanation: question.explanation ?? null, reward: result });
  } catch (e) {
    return apiError(e);
  }
}

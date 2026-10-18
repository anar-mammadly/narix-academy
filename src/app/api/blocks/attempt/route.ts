import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { canSeeLesson } from "@/lib/access";
import { gradeBlock, DEFAULT_PASS_MARK } from "@/lib/grading";
import { BLOCK_XP } from "@/lib/game";
import { reward } from "@/lib/game-server";
import { parseJson, type BlockType } from "@/types/blocks";

const Body = z.object({ blockId: z.string().min(1), answer: z.record(z.unknown()) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { blockId, answer } = Body.parse(await req.json());

    const block = await prisma.lessonBlock.findUnique({ where: { id: blockId }, include: { lesson: true } });
    if (!block || !(await canSeeLesson(session.userId, block.lesson))) {
      return NextResponse.json({ error: "Blok tapılmadı" }, { status: 404 });
    }

    const type = block.type as BlockType;
    const content = parseJson<unknown>(block.content, {});
    const grade = gradeBlock(type, content, answer, block.lesson.minQuizScore ?? DEFAULT_PASS_MARK);
    if (!grade) return NextResponse.json({ error: "Bu blok qiymətləndirilmir" }, { status: 400 });

    const prev = await prisma.blockAttempt.findUnique({ where: { userId_blockId: { userId: session.userId, blockId } } });
    await prisma.blockAttempt.upsert({
      where: { userId_blockId: { userId: session.userId, blockId } },
      create: { userId: session.userId, lessonId: block.lessonId, blockId, score: grade.score, passed: grade.passed, answer: JSON.stringify(answer) },
      update: {
        score: Math.max(prev?.score ?? 0, grade.score),
        passed: (prev?.passed ?? false) || grade.passed,
        attempts: { increment: 1 },
        answer: JSON.stringify(answer),
      },
    });

    // Wrong quiz answers go to the review deck.
    if (type === "QUIZ" && grade.wrongIds?.length) {
      await Promise.all(grade.wrongIds.map((questionId) =>
        prisma.reviewItem.upsert({
          where: { userId_blockId_questionId: { userId: session.userId, blockId, questionId } },
          create: { userId: session.userId, blockId, questionId, lessonId: block.lessonId },
          update: { box: 1, dueAt: new Date() },
        })
      ));
    }

    const base = BLOCK_XP[type] ?? 0;
    const result = grade.passed
      ? await reward(session.userId, [{ amount: Math.max(1, Math.round((base * grade.score) / 100)), reason: "BLOCK", refId: blockId }])
      : null;

    return NextResponse.json({ grade, reward: result });
  } catch (e) {
    return apiError(e);
  }
}

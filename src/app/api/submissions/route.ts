import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { canSeeLesson } from "@/lib/access";

const Body = z.object({ blockId: z.string().min(1), answer: z.string().trim().min(1).max(10000) });

// Open TASK answers, reviewed by the teacher.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { blockId, answer } = Body.parse(await req.json());
    const block = await prisma.lessonBlock.findUnique({ where: { id: blockId }, include: { lesson: true } });
    if (!block || block.type !== "TASK" || !(await canSeeLesson(session.userId, block.lesson))) {
      return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });
    }
    const sub = await prisma.submission.upsert({
      where: { userId_blockId: { userId: session.userId, blockId } },
      update: { answer },
      create: { userId: session.userId, lessonId: block.lessonId, blockId, answer },
    });
    return NextResponse.json({ id: sub.id, updatedAt: sub.updatedAt });
  } catch (e) {
    return apiError(e);
  }
}

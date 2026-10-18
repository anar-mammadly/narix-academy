import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

const replySchema = z.object({
  body: z.string().trim().min(1, "Cavab boş ola bilməz").max(5000, "Cavab çox uzundur"),
});

/** Students and teachers can reply; a teacher reply marks the question answered. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { body } = replySchema.parse(await req.json());
    const question = await prisma.question.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!question) throw new HttpError(404, "Sual tapılmadı");
    if (question.status === "CLOSED" && session.role !== "TEACHER") throw new HttpError(409, "Bu sual bağlanıb");

    const isTeacher = session.role === "TEACHER";
    const [reply] = await prisma.$transaction([
      prisma.questionReply.create({
        data: { questionId: id, userId: session.userId, body, isTeacher },
        include: { user: { select: { name: true, role: true } } },
      }),
      ...(isTeacher ? [prisma.question.update({ where: { id }, data: { status: "ANSWERED" } })] : []),
    ]);
    return NextResponse.json(reply, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

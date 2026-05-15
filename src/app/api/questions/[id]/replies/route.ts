import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { body } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Cavab boş ola bilməz" }, { status: 400 });
    const reply = await prisma.questionReply.create({
      data: { questionId: id, userId: session.userId, body, isTeacher: session.role === "TEACHER" },
    });
    // Mark question answered if teacher replied
    if (session.role === "TEACHER") {
      await prisma.question.update({ where: { id }, data: { status: "ANSWERED" } });
    }
    return NextResponse.json(reply, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

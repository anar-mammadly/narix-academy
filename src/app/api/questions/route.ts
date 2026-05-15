import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const questions = await prisma.question.findMany({
    include: { user: { select: { name: true, role: true } }, lesson: { select: { title: true } }, replies: { include: { user: { select: { name: true, role: true } } } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { title, body, lessonId } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Başlıq tələb olunur" }, { status: 400 });
    const q = await prisma.question.create({
      data: { userId: session.userId, title, body: body ?? "", lessonId: lessonId ?? null },
    });
    return NextResponse.json(q, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

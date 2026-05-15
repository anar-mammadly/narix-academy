import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lessonId } = await req.json();
    const progress = await prisma.progress.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: session.userId, lessonId, completed: true, completedAt: new Date() },
    });
    return NextResponse.json(progress);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

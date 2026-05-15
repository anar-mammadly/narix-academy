import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lessonId, content } = await req.json();
    const note = await prisma.note.upsert({
      where: { userId_lessonId: { userId: session.userId, lessonId } },
      update: { content },
      create: { userId: session.userId, lessonId, content },
    });
    return NextResponse.json(note);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

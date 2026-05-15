import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lessonId, blockId, answer } = await req.json();
    const sub = await prisma.submission.upsert({
      where: { userId_blockId: { userId: session.userId, blockId } },
      update: { answer },
      create: { userId: session.userId, lessonId, blockId, answer },
    });
    return NextResponse.json(sub);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { homeworkId, content } = await req.json();
    const sub = await prisma.homeworkSubmit.upsert({
      where: { homeworkId_userId: { homeworkId, userId: session.userId } },
      update: { content, status: "SUBMITTED" },
      create: { homeworkId, userId: session.userId, content },
    });
    return NextResponse.json(sub);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

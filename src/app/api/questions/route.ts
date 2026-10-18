import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { canSeeLesson } from "@/lib/access";
import { FeedQuery, getQuestionFeed } from "./query";

/** Question feed for logged-in users: ?filter=all|mine|answered|open&q=…&skip=… */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const sp = req.nextUrl.searchParams;
    const query = FeedQuery.parse({
      filter: sp.get("filter") ?? undefined,
      q: sp.get("q") ?? undefined,
      skip: sp.get("skip") ?? undefined,
    });
    return NextResponse.json(await getQuestionFeed(session, query));
  } catch (e) {
    return apiError(e);
  }
}

const CreateBody = z.object({
  title: z.string().trim().min(3, "Başlıq çox qısadır").max(140),
  body: z.string().trim().max(5000).optional().default(""),
  lessonId: z.string().min(1).max(64).nullish(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { title, body, lessonId } = CreateBody.parse(await req.json());

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, moduleId: true, published: true } });
      const allowed = lesson && (session.role === "TEACHER" || (await canSeeLesson(session.userId, lesson)));
      if (!allowed) return NextResponse.json({ error: "Dərs tapılmadı" }, { status: 404 });
    }

    const q = await prisma.question.create({
      data: { userId: session.userId, title, body, lessonId: lessonId ?? null },
      select: { id: true, title: true, body: true, status: true, pinned: true, createdAt: true, lessonId: true },
    });
    return NextResponse.json(q, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

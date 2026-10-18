import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { flattenPath, getStudentPath } from "@/lib/curriculum";
import type { SessionPayload } from "@/lib/auth";

export const QUESTION_PAGE_SIZE = 10;

export const QuestionFilter = z.enum(["all", "mine", "answered", "open"]);
export type QuestionFilter = z.infer<typeof QuestionFilter>;

export const FeedQuery = z.object({
  filter: QuestionFilter.default("all"),
  q: z.string().trim().max(100).default(""),
  skip: z.coerce.number().int().min(0).max(10000).default(0),
});
export type FeedQuery = z.infer<typeof FeedQuery>;

export type ReplyView = {
  id: string;
  body: string;
  isTeacher: boolean;
  createdAt: string;
  user: { name: string };
};

export type QuestionView = {
  id: string;
  title: string;
  body: string;
  status: string;
  pinned: boolean;
  createdAt: string;
  isMine: boolean;
  user: { name: string; isTeacher: boolean };
  lesson: { title: string; slug: string } | null;
  replies: ReplyView[];
};

export type FeedPage = { items: QuestionView[]; hasMore: boolean };

/** Lesson ids the caller may see; null means "all" (teachers). */
export async function visibleLessonIds(session: SessionPayload): Promise<string[] | null> {
  if (session.role === "TEACHER") return null;
  return flattenPath(await getStudentPath(session.userId)).map((l) => l.id);
}

export async function getQuestionFeed(session: SessionPayload, query: FeedQuery, lessonIds?: string[] | null): Promise<FeedPage> {
  const ids = lessonIds === undefined ? await visibleLessonIds(session) : lessonIds;

  const and: Prisma.QuestionWhereInput[] = [];
  // Questions about hidden lessons stay hidden from the student.
  if (ids) and.push({ OR: [{ lessonId: null }, { lessonId: { in: ids } }] });
  if (query.filter === "mine") and.push({ userId: session.userId });
  if (query.filter === "answered") and.push({ status: "ANSWERED" });
  if (query.filter === "open") and.push({ status: "OPEN" });
  if (query.q) {
    and.push({
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { body: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.question.findMany({
    where: { AND: and },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    skip: query.skip,
    take: QUESTION_PAGE_SIZE + 1,
    select: {
      id: true, title: true, body: true, status: true, pinned: true, createdAt: true, userId: true,
      user: { select: { name: true, role: true } },
      lesson: { select: { id: true, title: true, slug: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, isTeacher: true, createdAt: true, user: { select: { name: true } } },
      },
    },
  });

  const items = rows.slice(0, QUESTION_PAGE_SIZE).map((q): QuestionView => ({
    id: q.id,
    title: q.title,
    body: q.body,
    status: q.status,
    pinned: q.pinned,
    createdAt: q.createdAt.toISOString(),
    isMine: q.userId === session.userId,
    user: { name: q.user.name, isTeacher: q.user.role === "TEACHER" },
    lesson: q.lesson ? { title: q.lesson.title, slug: q.lesson.slug } : null,
    replies: q.replies.map((r) => ({
      id: r.id, body: r.body, isTeacher: r.isTeacher, createdAt: r.createdAt.toISOString(), user: { name: r.user.name },
    })),
  }));

  return { items, hasMore: rows.length > QUESTION_PAGE_SIZE };
}

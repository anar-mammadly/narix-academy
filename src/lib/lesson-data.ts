import "server-only";
import { prisma } from "./prisma";
import type { PlayerLesson } from "@/components/lesson/LessonPlayer";
import type { QuestionItem } from "@/components/lesson/LessonPanels";
import type { BlockType } from "@/types/blocks";

const lessonInclude = {
  module: { select: { title: true, coverColor: true } },
  blocks: { orderBy: { order: "asc" as const } },
};

export async function loadLesson(where: { slug: string } | { id: string }) {
  return prisma.lesson.findUnique({ where, include: lessonInclude });
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadLesson>>>;

export function toPlayerLesson(l: Loaded): PlayerLesson {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    shortDescription: l.shortDescription,
    estimatedMinutes: l.estimatedMinutes,
    minQuizScore: l.minQuizScore,
    module: { title: l.module.title, color: l.module.coverColor },
    blocks: l.blocks.map((b) => ({ id: b.id, type: b.type as BlockType, title: b.title, content: b.content, imageUrl: b.imageUrl, order: b.order })),
  };
}

/** Everything the player needs that belongs to one student. */
export async function loadStudentLessonState(userId: string, lessonId: string) {
  const [attempts, submissions, note, questions, progress] = await Promise.all([
    prisma.blockAttempt.findMany({ where: { userId, lessonId } }),
    prisma.submission.findMany({ where: { userId, lessonId }, select: { blockId: true, answer: true } }),
    prisma.note.findUnique({ where: { userId_lessonId: { userId, lessonId } }, select: { content: true } }),
    prisma.question.findMany({
      where: { lessonId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, role: true } },
        replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      },
    }),
    prisma.progress.findUnique({ where: { userId_lessonId: { userId, lessonId } }, select: { completed: true } }),
  ]);

  return {
    attempts: Object.fromEntries(attempts.map((a) => [a.blockId, { score: a.score, passed: a.passed, answer: safeJson(a.answer) }])),
    submissions: Object.fromEntries(submissions.map((s) => [s.blockId, s.answer])),
    note: note?.content ?? "",
    questions: questions as unknown as QuestionItem[],
    completed: progress?.completed ?? false,
  };
}

function safeJson(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw); } catch { return {}; }
}

import { prisma } from "./prisma";
import { parseJson, type TaskContent, type QuizContent } from "@/types/blocks";

export async function canStudentCompleteLesson(
  userId: string,
  lessonId: string
): Promise<{ ok: boolean; reasons: string[] }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      blocks: { where: { type: "TASK" } },
    },
  });
  if (!lesson) return { ok: false, reasons: ["Dərs tapılmadı"] };

  const progress = await prisma.progress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });

  const reasons: string[] = [];

  for (const block of lesson.blocks) {
    const c = parseJson<TaskContent>(block.content, {
      instructions: "",
      placeholder: "",
      required: true,
    });
    if (!c.required) continue;
    const sub = await prisma.submission.findUnique({
      where: { userId_blockId: { userId, blockId: block.id } },
    });
    if (!sub || !sub.answer.trim()) {
      const label = block.title?.trim() || "Tapşırıq";
      reasons.push(`"${label}" təqdim edilməyib`);
    }
  }

  const quizBlock = await prisma.lessonBlock.findFirst({
    where: { lessonId, type: "QUIZ" },
  });

  if (lesson.minQuizScore != null && quizBlock) {
    const score = progress?.quizScore ?? 0;
    if (score < lesson.minQuizScore) {
      reasons.push(`Minimum test balı: ${lesson.minQuizScore}% (cari: ${score}%)`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

export async function lessonHasQuiz(lessonId: string): Promise<boolean> {
  const n = await prisma.lessonBlock.count({ where: { lessonId, type: "QUIZ" } });
  return n > 0;
}

export function getQuizQuestionCount(contentJson: string): number {
  const c = parseJson<QuizContent>(contentJson, { questions: [] });
  return c.questions?.length ?? 0;
}

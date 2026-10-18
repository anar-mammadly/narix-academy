import "server-only";
import { prisma } from "./prisma";

/** True when the published lesson (and its module) is visible to this student. */
export async function canSeeLesson(userId: string, lesson: { id: string; moduleId: string; published: boolean }) {
  if (!lesson.published) return false;
  const hidden = await prisma.studentContentVisibility.findFirst({
    where: {
      studentId: userId,
      visible: false,
      OR: [{ lessonId: lesson.id }, { moduleId: lesson.moduleId, lessonId: null }],
    },
    select: { id: true },
  });
  if (hidden) return false;
  const mod = await prisma.module.findUnique({ where: { id: lesson.moduleId }, select: { published: true } });
  return !!mod?.published;
}

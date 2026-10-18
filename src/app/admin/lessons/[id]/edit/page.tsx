import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/types/blocks";
import { LessonEditor } from "@/components/admin/lesson-editor/LessonEditor";

export const metadata: Metadata = { title: "Dərs redaktoru" };

export default async function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;

  const [lesson, modules] = await Promise.all([
    prisma.lesson.findUnique({ where: { id }, include: { blocks: { orderBy: { order: "asc" } } } }),
    prisma.module.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!lesson) notFound();

  return (
    <LessonEditor
      lesson={{
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        shortDescription: lesson.shortDescription,
        estimatedMinutes: lesson.estimatedMinutes,
        minQuizScore: lesson.minQuizScore,
        published: lesson.published,
        moduleId: lesson.moduleId,
      }}
      blocks={lesson.blocks.map((b) => ({ id: b.id, type: b.type, title: b.title, content: parseJson<unknown>(b.content, {}), order: b.order }))}
      modules={modules}
    />
  );
}

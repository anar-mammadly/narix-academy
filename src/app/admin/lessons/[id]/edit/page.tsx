import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { LessonBuilder } from "@/frontend/components/admin/LessonBuilder";

export default async function EditLessonPage({ params }: { params: { id: string } }) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: { blocks: true },
  });
  if (!lesson) notFound();

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="animate-fade-in">
      <Link href="/admin/lessons" className="text-sm text-blue-600 hover:underline">
        ← Dərslər siyahısı
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Dərs redaktoru</h1>
      <p className="text-slate-600">{lesson.title}</p>
      <div className="mt-6">
        <LessonBuilder
          initialLesson={{
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            shortDescription: lesson.shortDescription,
            moduleId: lesson.moduleId,
            estimatedMinutes: lesson.estimatedMinutes,
            coverImageUrl: lesson.coverImageUrl,
            published: lesson.published,
            quizEnabled: lesson.quizEnabled,
            minQuizScore: lesson.minQuizScore,
            blocks: lesson.blocks.map((b) => ({
              id: b.id,
              type: b.type,
              title: b.title,
              content: b.content,
              settings: b.settings,
              imageUrl: b.imageUrl,
              order: b.order,
            })),
          }}
          modules={modules}
        />
      </div>
    </div>
  );
}

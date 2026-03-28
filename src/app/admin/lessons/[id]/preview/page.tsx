import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { isRemoteImageSrc } from "@/frontend/lib/remote-image";
import { LessonBlocksStudent } from "@/frontend/components/lesson/LessonBlocksStudent";

export default async function AdminLessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } }, module: true },
  });
  if (!lesson) notFound();

  const blocks = lesson.blocks.map((b) => ({
    id: b.id,
    type: b.type,
    title: b.title,
    content: b.content,
    imageUrl: b.imageUrl,
  }));

  return (
    <div className="mx-auto max-w-3xl animate-fade-in pb-16">
      <Link href={`/admin/lessons/${lesson.id}/edit`} className="text-sm text-blue-600 hover:underline">
        ← Redaktəyə qayıt
      </Link>
      <header className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        {lesson.coverImageUrl ? (
          <div className="relative h-48 w-full bg-slate-100">
            <Image
              src={lesson.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized={isRemoteImageSrc(lesson.coverImageUrl)}
            />
          </div>
        ) : null}
        <div className="p-8">
          <p className="text-sm font-medium text-blue-600">{lesson.module.title}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{lesson.title}</h1>
          {lesson.shortDescription ? (
            <p className="mt-2 text-slate-600">{lesson.shortDescription}</p>
          ) : null}
        </div>
      </header>
      <div className="mt-10">
        <LessonBlocksStudent
          lessonId={lesson.id}
          blocks={blocks}
          minQuizScore={lesson.minQuizScore}
          initialProgress={{
            quizScore: null,
            quizPassed: false,
            quizAttempts: 0,
            completed: false,
          }}
          taskAnswers={{}}
          mode="preview"
        />
      </div>
    </div>
  );
}

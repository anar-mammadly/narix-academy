import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isRemoteImageSrc } from "@/lib/remote-image";
import { LessonBlocksStudent } from "@/components/lesson/LessonBlocksStudent";

export default async function StudentLessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) return null;

  // Next.js dynamic route params can be a Promise in async server components.
  const { slug } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: {
      slug,
      published: true,
      contentVisibility: { none: { studentId: session.userId, visible: false } },
      module: {
        published: true,
        contentVisibility: {
          none: { studentId: session.userId, visible: false, lessonId: null },
        },
      },
    },
    include: {
      blocks: { orderBy: { order: "asc" } },
      module: true,
    },
  });

  if (!lesson) notFound();

  const progress = await prisma.progress.findUnique({
    where: { userId_lessonId: { userId: session.userId, lessonId: lesson.id } },
  });

  const taskBlocks = lesson.blocks.filter((b) => b.type === "TASK");
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.userId,
      blockId: { in: taskBlocks.map((b) => b.id) },
    },
  });
  const taskAnswers: Record<string, string> = {};
  for (const s of submissions) {
    taskAnswers[s.blockId] = s.answer;
  }

  const blocks = lesson.blocks.map((b) => ({
    id: b.id,
    type: b.type,
    title: b.title,
    content: b.content,
    imageUrl: b.imageUrl,
  }));

  return (
    <div className="mx-auto max-w-3xl animate-fade-in pb-16">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Panelə qayıt
      </Link>
      <header className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        {lesson.coverImageUrl ? (
          <div className="relative h-52 w-full bg-slate-100">
            <Image
              src={lesson.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              priority
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
          <p className="mt-3 text-sm text-slate-500">Təxmini müddət: {lesson.estimatedMinutes} dəq</p>
        </div>
      </header>

      <div className="mt-10">
        <LessonBlocksStudent
          lessonId={lesson.id}
          blocks={blocks}
          minQuizScore={lesson.minQuizScore}
          initialProgress={{
            quizScore: progress?.quizScore ?? null,
            quizPassed: progress?.quizPassed ?? false,
            quizAttempts: progress?.quizAttempts ?? 0,
            completed: progress?.completed ?? false,
          }}
          taskAnswers={taskAnswers}
          mode="study"
        />
      </div>
    </div>
  );
}

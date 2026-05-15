import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import LessonView from "@/components/lesson/LessonView";

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const lesson = await prisma.lesson.findUnique({
    where: { slug, published: true },
    include: {
      module: true,
      blocks: { orderBy: { order: "asc" } },
      homeworks: true,
    },
  });
  if (!lesson) notFound();

  const [progress, submissions, note, questions] = await Promise.all([
    prisma.progress.findUnique({ where: { userId_lessonId: { userId: session.userId, lessonId: lesson.id } } }),
    prisma.submission.findMany({ where: { userId: session.userId, lessonId: lesson.id } }),
    prisma.note.findUnique({ where: { userId_lessonId: { userId: session.userId, lessonId: lesson.id } } }),
    prisma.question.findMany({
      where: { lessonId: lesson.id },
      include: { user: true, replies: { include: { user: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <LessonView
      lesson={lesson as any}
      progress={progress}
      submissions={submissions}
      note={note}
      questions={questions as any}
      session={session}
    />
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flattenPath, getStudentPath } from "@/lib/curriculum";
import { loadLesson, loadStudentLessonState, toPlayerLesson } from "@/lib/lesson-data";
import LessonPlayer from "@/components/lesson/LessonPlayer";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { slug }, select: { title: true } });
  return { title: lesson?.title ?? "Dərs" };
}

export default async function LearnPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const lesson = await loadLesson({ slug });
  if (!lesson) notFound();
  if (session.role === "TEACHER") redirect(`/preview/${lesson.id}`);

  // Only lessons on this student's path, and not locked.
  const path = flattenPath(await getStudentPath(session.userId));
  const index = path.findIndex((l) => l.id === lesson.id);
  if (index === -1) notFound();
  if (path[index].status === "locked") redirect("/dashboard/lessons?locked=1");

  const [state, user] = await Promise.all([
    loadStudentLessonState(session.userId, lesson.id),
    prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { name: true, xp: true, streakCount: true } }),
  ]);
  const prev = path[index - 1];
  const next = path[index + 1];

  return (
    <LessonPlayer
      lesson={toPlayerLesson(lesson)}
      {...state}
      prev={prev ? { slug: prev.slug, title: prev.title } : null}
      next={next ? { slug: next.slug, title: next.title, locked: next.status === "locked" } : null}
      user={{ name: user.name, xp: user.xp, streak: user.streakCount }}
      backHref="/dashboard/lessons"
      linkBase="/learn"
    />
  );
}

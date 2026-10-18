import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadLesson, toPlayerLesson } from "@/lib/lesson-data";
import LessonPlayer from "@/components/lesson/LessonPlayer";

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;

  const lesson = await loadLesson({ id });
  if (!lesson) notFound();

  const siblings = await prisma.lesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, title: true },
  });
  const i = siblings.findIndex((s) => s.id === lesson.id);
  const nav = (s?: { id: string; title: string }) => (s ? { slug: s.id, title: s.title } : null);

  return (
    <div className="min-h-dvh bg-bg">
      <div className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-sm text-bg">
        <Eye className="h-4 w-4" aria-hidden /> Önizləmə — tələbə dərsi belə görür. Cavablar saxlanılmır.
      </div>
      <LessonPlayer
        lesson={toPlayerLesson(lesson)}
        attempts={{}}
        submissions={{}}
        note=""
        questions={[]}
        completed={false}
        prev={nav(siblings[i - 1])}
        next={nav(siblings[i + 1])}
        user={{ name: session.name, xp: 0, streak: 0 }}
        previewMode
        backHref={`/admin/lessons/${lesson.id}/edit`}
        linkBase="/preview"
      />
    </div>
  );
}

import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LessonView from "@/components/lesson/LessonView";

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: true,
      blocks: { orderBy: { order: "asc" } },
      homeworks: true,
    },
  });
  if (!lesson) notFound();

  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-30 bg-gray-900 text-white text-sm text-center py-2 px-4">
        👁 Önizləmə rejimi — tələbələr dərsi belə görəcək. Bura yazılan cavablar/qeydlər saxlanılmır.
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <LessonView
          lesson={lesson as any}
          progress={null}
          submissions={[]}
          note={null}
          questions={[]}
          session={session}
          previewMode
        />
      </div>
    </div>
  );
}

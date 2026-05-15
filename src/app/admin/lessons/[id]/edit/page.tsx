import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LessonEditor from "./LessonEditor";

export default async function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      blocks: { orderBy: { order: "asc" } },
      module: { select: { id: true, title: true } },
    },
  });
  if (!lesson) notFound();

  return <LessonEditor lesson={lesson} />;
}

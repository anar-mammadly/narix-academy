import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminHomeworkClient, { type HomeworkItem } from "./AdminHomeworkClient";

export const metadata: Metadata = { title: "Tapşırıqlar" };

export default async function AdminHomeworkPage() {
  await requireTeacher();
  const [homeworks, lessons] = await Promise.all([
    prisma.homework.findMany({
      include: {
        lesson: { select: { title: true } },
        submits: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { submittedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lesson.findMany({
      select: { id: true, title: true, module: { select: { title: true } } },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    }),
  ]);

  const items: HomeworkItem[] = homeworks.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    dueDate: h.dueDate?.toISOString() ?? null,
    lessonTitle: h.lesson.title,
    submits: h.submits.map((s) => ({
      id: s.id,
      content: s.content,
      fileUrl: s.fileUrl,
      grade: s.grade,
      feedback: s.feedback,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      user: { name: s.user.name, avatarUrl: s.user.avatarUrl },
    })),
  }));

  return <AdminHomeworkClient homeworks={items} lessons={lessons.map((l) => ({ id: l.id, title: `${l.module.title} · ${l.title}` }))} />;
}

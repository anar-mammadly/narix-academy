import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminQuestionsClient, { type QuestionItem } from "./AdminQuestionsClient";

export const metadata: Metadata = { title: "Suallar" };

export default async function AdminQuestionsPage() {
  await requireTeacher();
  const questions = await prisma.question.findMany({
    include: {
      user: { select: { name: true, avatarUrl: true } },
      lesson: { select: { title: true } },
      replies: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const items: QuestionItem[] = questions.map((q) => ({
    id: q.id,
    title: q.title,
    body: q.body,
    status: q.status === "ANSWERED" || q.status === "CLOSED" ? q.status : "OPEN",
    pinned: q.pinned,
    createdAt: q.createdAt.toISOString(),
    user: q.user,
    lessonTitle: q.lesson?.title ?? null,
    replies: q.replies.map((r) => ({ id: r.id, body: r.body, isTeacher: r.isTeacher, createdAt: r.createdAt.toISOString(), user: r.user })),
  }));

  return <AdminQuestionsClient questions={items} />;
}

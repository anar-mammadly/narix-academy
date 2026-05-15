import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminQuestionsClient from "./AdminQuestionsClient";

export default async function AdminQuestionsPage() {
  await requireTeacher();
  const questions = await prisma.question.findMany({
    include: {
      user: { select: { name: true } },
      lesson: { select: { title: true } },
      replies: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return <AdminQuestionsClient questions={questions} />;
}

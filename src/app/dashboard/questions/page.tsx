import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import QuestionsClient from "./QuestionsClient";

export default async function QuestionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const questions = await prisma.question.findMany({
    include: {
      user: { select: { name: true, role: true } },
      lesson: { select: { title: true, slug: true } },
      replies: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return <QuestionsClient questions={questions} session={session} />;
}

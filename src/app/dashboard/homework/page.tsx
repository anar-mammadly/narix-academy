import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flattenPath, getStudentPath } from "@/lib/curriculum";
import { PageHeader } from "@/components/layout/PageHeader";
import HomeworkClient, { type HomeworkItem } from "./HomeworkClient";

export const metadata = { title: "Ev tapşırıqları" };

export default async function HomeworkPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const lessons = flattenPath(await getStudentPath(session.userId));
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  const homeworks = await prisma.homework.findMany({
    where: { lessonId: { in: lessons.map((l) => l.id) } },
    select: {
      id: true, title: true, description: true, dueDate: true, lessonId: true, createdAt: true,
      submits: {
        where: { userId: session.userId },
        select: { content: true, status: true, grade: true, feedback: true, submittedAt: true },
      },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });

  const items: HomeworkItem[] = homeworks.map((h) => {
    const lesson = lessonMap.get(h.lessonId);
    const s = h.submits[0];
    return {
      id: h.id,
      title: h.title,
      description: h.description,
      dueDate: h.dueDate?.toISOString() ?? null,
      lesson: { title: lesson?.title ?? "", slug: lesson?.slug ?? "", moduleTitle: lesson?.moduleTitle ?? "" },
      submit: s
        ? { content: s.content, status: s.status, grade: s.grade, feedback: s.feedback, submittedAt: s.submittedAt.toISOString() }
        : null,
    };
  });

  return (
    <>
      <PageHeader title="Ev tapşırıqları" description="Cavabını göndər, müəllimin rəyini burada gör." />
      <HomeworkClient initial={items} now={new Date().toISOString()} />
    </>
  );
}

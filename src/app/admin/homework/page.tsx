import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminHomeworkClient from "./AdminHomeworkClient";

export default async function AdminHomeworkPage() {
  await requireTeacher();
  const [homeworks, lessons] = await Promise.all([
    prisma.homework.findMany({
      include: {
        lesson: { select: { title: true } },
        submits: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lesson.findMany({ where: { published: true }, select: { id: true, title: true }, orderBy: { order: "asc" } }),
  ]);
  return <AdminHomeworkClient homeworks={homeworks} lessons={lessons} />;
}

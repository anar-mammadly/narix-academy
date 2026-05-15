import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HomeworkClient from "./HomeworkClient";

export default async function HomeworkPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const homeworks = await prisma.homework.findMany({
    include: {
      lesson: { select: { title: true, slug: true } },
      submits: { where: { userId: session.userId } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <HomeworkClient homeworks={homeworks} userId={session.userId} />;
}

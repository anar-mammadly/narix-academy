import { prisma } from "@/lib/prisma";
import { StudentContentVisibilityClient } from "./StudentContentVisibilityClient";

export default async function StudentContentVisibilityPage() {
  const [students, modules] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.module.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        lessons: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
      },
    }),
  ]);

  return <StudentContentVisibilityClient students={students} modules={modules} />;
}


import { prisma } from "@/server/db/prisma";
import { SubmissionsClient } from "./SubmissionsClient";

export default async function AdminSubmissionsPage() {
  const [lessons, students] = await Promise.all([
    prisma.lesson.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tapşırıq təqdimatları</h1>
        <p className="text-slate-600">Tələbə cavablarını filtrələyin və oxuyun</p>
      </div>
      <SubmissionsClient lessons={lessons} students={students} />
    </div>
  );
}

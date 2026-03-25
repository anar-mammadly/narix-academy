import Link from "next/link";
import { prisma } from "@/server/db/prisma";
import { Badge } from "@/frontend/components/ui/badge";

export default async function AdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: {
      progress: true,
      submissions: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tələbələr</h1>
          <p className="text-slate-600">İrəliləyiş və statistikalar</p>
        </div>
        <Link
          href="/admin/students/new"
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tələbə yarat
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Ad</th>
              <th className="px-4 py-3 font-semibold">E-poçt</th>
              <th className="px-4 py-3 font-semibold">Tamamlanan dərs</th>
              <th className="px-4 py-3 font-semibold">Təqdimat</th>
              <th className="px-4 py-3 font-semibold">Test ortalaması</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  Hələ tələbə yoxdur 👋
                </td>
              </tr>
            ) : (
              students.map((u) => {
                const completed = u.progress.filter((p) => p.completed).length;
                const scores = u.progress.filter((p) => p.quizScore != null).map((p) => p.quizScore as number);
                const avg =
                  scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">{completed}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{u.submissions.length}</td>
                    <td className="px-4 py-3 text-slate-700">{avg != null ? `${avg}%` : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

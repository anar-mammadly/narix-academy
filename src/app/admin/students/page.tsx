import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, CheckCircle2, Trophy } from "lucide-react";
import { getInitials, calculateProgress } from "@/lib/utils";

export default async function AdminStudentsPage() {
  await requireTeacher();

  const [students, allProgress, totalLessons] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { createdAt: "asc" } }),
    prisma.progress.findMany({ where: { user: { role: "STUDENT" } } }),
    prisma.lesson.count({ where: { published: true } }),
  ]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={24} className="text-blue-600" /> Tələbələr
          </h1>
          <p className="text-muted mt-1">{students.length} tələbə qeydiyyatdadır</p>
        </div>
        <a href="/admin/students/new" className="btn-primary">Tələbə əlavə et</a>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Tələbə</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">E-poçt</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted">Tamamlanan</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted">İrəliləyiş</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted">Qeydiyyat</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => {
              const prog = allProgress.filter(p => p.userId === s.id);
              const completed = prog.filter(p => p.completed).length;
              const pct = calculateProgress(completed, totalLessons);
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(s.name)}
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.email}</td>
                  <td className="px-4 py-3 text-center font-semibold">{completed}/{totalLessons}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="progress-bar flex-1">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted">
                    {new Date(s.createdAt).toLocaleDateString("az-AZ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

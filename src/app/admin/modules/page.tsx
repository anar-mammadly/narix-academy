import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Plus, Edit, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminModulesPage() {
  await requireTeacher();

  const modules = await prisma.module.findMany({
    include: { lessons: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" /> Modullar & Dərslər
          </h1>
          <p className="text-muted mt-1">{modules.length} modul, {modules.reduce((a, m) => a + m.lessons.length, 0)} dərs</p>
        </div>
        <Link href="/admin/modules/new" className="btn-primary">
          <Plus size={16} /> Modul əlavə et
        </Link>
      </div>

      <div className="space-y-4">
        {modules.map((mod, i) => (
          <div key={mod.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{mod.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`badge ${mod.published ? "badge-green" : "badge-gray"}`}>
                      {mod.published ? "Yayımlandı" : "Qaralama"}
                    </div>
                    <span className="text-xs text-muted">{mod.lessons.length} dərs</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/modules/${mod.id}/edit`} className="btn-secondary btn-sm">
                  <Edit size={13} /> Düzəlt
                </Link>
                <Link href={`/admin/modules/${mod.id}/lessons/new`} className="btn-primary btn-sm">
                  <Plus size={13} /> Dərs əlavə et
                </Link>
              </div>
            </div>

            {mod.lessons.length > 0 && (
              <div className="border-t border-gray-100 pt-3 space-y-1">
                {mod.lessons.map((lesson, j) => (
                  <div key={lesson.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-xs text-muted w-6">{i + 1}.{j + 1}</span>
                    <span className={cn("flex-1 text-sm font-medium", !lesson.published && "text-gray-400")}>{lesson.title}</span>
                    <div className="flex items-center gap-2">
                      {!lesson.published && <div className="badge badge-gray text-xs">Qaralama</div>}
                      {lesson.quizEnabled && <div className="badge badge-blue text-xs">Quiz</div>}
                      <Link href={`/admin/lessons/${lesson.id}/edit`} className="btn-ghost btn-sm py-1 px-2">
                        <Edit size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

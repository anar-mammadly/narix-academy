import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Users, BookOpen, MessageCircle, ClipboardList, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  await requireTeacher();

  const [studentCount, lessonCount, openQuestions, pendingHomework, recentProgress] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.lesson.count({ where: { published: true } }),
    prisma.question.count({ where: { status: "OPEN" } }),
    prisma.homeworkSubmit.count({ where: { status: "SUBMITTED", grade: null } }),
    prisma.progress.findMany({
      where: { completed: true },
      orderBy: { completedAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } }, lesson: { select: { title: true } } },
    }),
  ]);

  const stats = [
    { label: "Tələbələr", value: studentCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/students" },
    { label: "Yayımlanmış dərslər", value: lessonCount, icon: BookOpen, color: "text-green-600", bg: "bg-green-50", href: "/admin/modules" },
    { label: "Açıq suallar", value: openQuestions, icon: MessageCircle, color: "text-orange-500", bg: "bg-orange-50", href: "/admin/questions" },
    { label: "Qiymətləndirilməyən tapşırıqlar", value: pendingHomework, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50", href: "/admin/homework" },
  ];

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-muted mt-1">Platformanın ümumi vəziyyəti</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="card-hover">
            <div className={`inline-flex w-11 h-11 rounded-xl ${bg} items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-muted mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} className="text-blue-600" />
          <h2 className="font-bold text-gray-900">Son fəaliyyət</h2>
        </div>
        <div className="card overflow-hidden p-0">
          {recentProgress.length === 0 ? (
            <div className="text-center text-muted py-8">Hələ fəaliyyət yoxdur</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentProgress.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-medium text-gray-900">{p.user.name}</span>
                    <span className="text-muted"> — {p.lesson.title}</span>
                  </div>
                  <div className="text-xs text-muted shrink-0">
                    {p.completedAt ? new Date(p.completedAt).toLocaleDateString("az-AZ") : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FolderOpen, Inbox, Plus } from "lucide-react";

export default async function AdminDashboardPage() {
  const [studentCount, moduleCount, lessonCount, submissionCount, recentSubs] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.submission.count(),
    prisma.submission.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        lesson: { select: { title: true } },
      },
    }),
  ]);

  const statCards = [
    { label: "Tələbələr", value: studentCount, icon: Users, href: "/admin/students" },
    { label: "Modullar", value: moduleCount, icon: FolderOpen, href: "/admin/modules" },
    { label: "Dərslər", value: lessonCount, icon: BookOpen, href: "/admin/lessons" },
    { label: "Təqdimatlar", value: submissionCount, icon: Inbox, href: "/admin/submissions" },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">İdarə paneli</h1>
        <p className="mt-1 text-slate-600">QA Academy — dərs və tələbə idarəetməsi</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/lessons/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Yeni dərs
        </Link>
        <Link
          href="/admin/modules/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Yeni modul
        </Link>
        <Link
          href="/admin/students/new"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Tələbə əlavə et
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="h-full transition-transform hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
                <Icon className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <div className="px-6 pb-6">
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son fəaliyyət</CardTitle>
          <p className="text-sm text-slate-500">Son tapşırıq təqdimatları</p>
        </CardHeader>
        <ul className="divide-y divide-slate-100 px-6 pb-6">
          {recentSubs.length === 0 ? (
            <li className="py-8 text-center text-slate-500">Hələ təqdimat yoxdur ✨</li>
          ) : (
            recentSubs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium text-slate-800">{s.user.name}</span>
                <span className="text-slate-600">{s.lesson.title}</span>
                <span className="text-xs text-slate-400">
                  {new Date(s.createdAt).toLocaleString("az-AZ")}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

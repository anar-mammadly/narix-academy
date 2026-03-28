import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/server/db/prisma";
import { LessonAdminTable } from "./LessonAdminTable";
import { LessonFilters } from "./LessonFilters";

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; moduleId?: string; published?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const moduleId = sp.moduleId;
  const published = sp.published;

  const [modules, lessons] = await Promise.all([
    prisma.module.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
    prisma.lesson.findMany({
      where: {
        ...(moduleId ? { moduleId } : {}),
        ...(published === "true" ? { published: true } : {}),
        ...(published === "false" ? { published: false } : {}),
        ...(q ? { title: { contains: q } } : {}),
      },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        module: { select: { title: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dərslər</h1>
          <p className="text-slate-600">Bütün dərsləri idarə edin</p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Yeni dərs
        </Link>
      </div>
      <Suspense fallback={null}>
        <LessonFilters modules={modules} />
      </Suspense>
      <LessonAdminTable lessons={lessons} />
    </div>
  );
}

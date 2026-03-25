import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuleListClient } from "./ModuleListClient";

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modullar</h1>
          <p className="text-slate-600">Kurs hissələrini idarə edin və sıralayın</p>
        </div>
        <Link
          href="/admin/modules/new"
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Modul yarat
        </Link>
      </div>
      {modules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          <p className="mb-2 text-3xl">📂</p>
          <p>Hələ modul yoxdur. İlk modulunuzu yaradın.</p>
        </div>
      ) : (
        <ModuleListClient
          key={modules.map((m) => `${m.id}-${m.order}`).join("|")}
          initial={modules}
        />
      )}
    </div>
  );
}

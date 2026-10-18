import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonStyles } from "@/components/ui/Button";
import { ModulesClient, type ModuleListItem } from "@/components/admin/ModulesClient";

export const metadata: Metadata = { title: "Modullar və dərslər" };

export default async function AdminModulesPage() {
  await requireTeacher();

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, published: true, estimatedMinutes: true, _count: { select: { blocks: true } } },
      },
    },
  });

  const items: ModuleListItem[] = modules.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    published: m.published,
    icon: m.icon,
    color: m.coverColor,
    lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, published: l.published, minutes: l.estimatedMinutes, blocks: l._count.blocks })),
  }));
  const lessonCount = items.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div>
      <PageHeader
        title="Modullar və dərslər"
        description={`${items.length} modul · ${lessonCount} dərs. Sıranı dəyişmək üçün tutacaqdan sürüşdürün.`}
        actions={
          <Link href="/admin/modules/new" className={buttonStyles()}>
            <Plus className="h-4 w-4" aria-hidden /> Modul yarat
          </Link>
        }
      />
      <ModulesClient modules={items} />
    </div>
  );
}

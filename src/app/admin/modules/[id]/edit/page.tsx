import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ModuleEditClient from "./ModuleEditClient";

export const metadata: Metadata = { title: "Modulu idarə et" };

export default async function ModuleEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  await requireTeacher();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const mod = await prisma.module.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, published: true, estimatedMinutes: true, _count: { select: { blocks: true, progress: true } } },
      },
    },
  });
  if (!mod) notFound();

  return (
    <ModuleEditClient
      openNewLesson={sp.new === "1"}
      module={{
        id: mod.id,
        title: mod.title,
        titleEn: mod.titleEn ?? "",
        description: mod.description ?? "",
        descriptionEn: mod.descriptionEn ?? "",
        published: mod.published,
        icon: mod.icon,
        coverColor: mod.coverColor,
      }}
      lessons={mod.lessons.map((l) => ({
        id: l.id, title: l.title, published: l.published, minutes: l.estimatedMinutes, blocks: l._count.blocks, learners: l._count.progress,
      }))}
    />
  );
}

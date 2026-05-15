import { requireTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ModuleEditClient from "./ModuleEditClient";

export default async function ModuleEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const { id } = await params;
  const mod = await prisma.module.findUnique({
    where: { id },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!mod) notFound();
  return <ModuleEditClient module={mod} />;
}

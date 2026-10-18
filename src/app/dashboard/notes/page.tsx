import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { flattenPath, getStudentPath } from "@/lib/curriculum";
import { PageHeader } from "@/components/layout/PageHeader";
import NotesClient, { type NoteItem } from "./NotesClient";

export const metadata = { title: "Qeydlər" };

export default async function NotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [notes, path] = await Promise.all([
    prisma.note.findMany({
      where: { userId: session.userId, NOT: { content: "" } },
      select: { id: true, lessonId: true, content: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    getStudentPath(session.userId),
  ]);

  const visible = new Map(flattenPath(path).map((l) => [l.id, l]));
  // Notes on lessons that are now hidden stay readable, but without a link.
  const missing = notes.filter((n) => !visible.has(n.lessonId)).map((n) => n.lessonId);
  const others = missing.length
    ? await prisma.lesson.findMany({
        where: { id: { in: missing } },
        select: { id: true, title: true, module: { select: { title: true } } },
      })
    : [];
  const otherMap = new Map(others.map((l) => [l.id, l]));

  const items: NoteItem[] = notes.map((n) => {
    const v = visible.get(n.lessonId);
    const o = otherMap.get(n.lessonId);
    return {
      id: n.id,
      lessonId: n.lessonId,
      content: n.content,
      updatedAt: n.updatedAt.toISOString(),
      lessonTitle: v?.title ?? o?.title ?? "Silinmiş dərs",
      moduleTitle: v?.moduleTitle ?? o?.module.title ?? "",
      slug: v?.slug ?? null,
    };
  });

  const firstLesson = flattenPath(path).find((l) => l.status === "current") ?? flattenPath(path)[0];

  return (
    <>
      <PageHeader title="Qeydlər" description="Dərslər üzrə şəxsi qeydlərin. Yalnız sən görürsən." />
      <NotesClient initial={items} startSlug={firstLesson?.slug ?? null} />
    </>
  );
}

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default async function NotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const notes = await prisma.note.findMany({
    where: { userId: session.userId, NOT: { content: "" } },
    include: { user: false },
    orderBy: { updatedAt: "desc" },
  });

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: notes.map(n => n.lessonId) } },
    select: { id: true, title: true, slug: true, module: { select: { title: true } } },
  });
  const lessonMap = Object.fromEntries(lessons.map(l => [l.id, l]));

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={24} className="text-blue-600" /> Qeydlər
        </h1>
        <p className="text-muted mt-1">Dərslər üzrə şəxsi qeydlərin</p>
      </div>

      {notes.length === 0 ? (
        <div className="card text-center text-muted py-10">
          Hələ qeyd yoxdur. Dərs oxuyarkən qeyd götür!
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const lesson = lessonMap[note.lessonId];
            return (
              <div key={note.id} className="card space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-blue-600 font-medium">{lesson?.module?.title}</div>
                    <div className="font-semibold text-gray-900">{lesson?.title ?? "Silinmiş dərs"}</div>
                  </div>
                  {lesson && (
                    <Link href={`/dashboard/lessons/${lesson.slug}`} className="btn-ghost btn-sm shrink-0">
                      Dərsi aç <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
                <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">
                  {note.content}
                </div>
                <div className="text-xs text-muted">
                  {new Date(note.updatedAt).toLocaleDateString("az-AZ")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

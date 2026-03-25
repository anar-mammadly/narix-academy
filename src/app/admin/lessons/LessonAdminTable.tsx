"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Trash2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type LessonAdminRow = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  module: { title: string };
};

export function LessonAdminTable({ lessons }: { lessons: LessonAdminRow[] }) {
  const router = useRouter();

  async function dup(id: string) {
    await fetch(`/api/lessons/${id}/duplicate`, { method: "POST" });
    router.refresh();
  }

  async function del(id: string) {
    if (!confirm("Dərsi silmək?")) return;
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        <p className="mb-2 text-3xl">📖</p>
        <p>Uyğun dərs tapılmadı.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Başlıq</th>
            <th className="px-4 py-3 font-semibold">Modul</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Əməliyyatlar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lessons.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-slate-900">{l.title}</td>
              <td className="px-4 py-3 text-slate-600">{l.module.title}</td>
              <td className="px-4 py-3">
                <Badge variant={l.published ? "success" : "warning"}>
                  {l.published ? "Dərc" : "Qaralama"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-1">
                  <Link
                    href={`/admin/lessons/${l.id}/edit`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Redaktə
                  </Link>
                  <Link
                    href={`/admin/lessons/${l.id}/preview`}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Önizləmə
                  </Link>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => dup(l.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-red-600"
                    onClick={() => del(l.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

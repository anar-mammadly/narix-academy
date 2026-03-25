"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";

export type ModuleRow = {
  id: string;
  title: string;
  published: boolean;
  order: number;
  _count: { lessons: number };
};

export function ModuleListClient({ initial }: { initial: ModuleRow[] }) {
  const router = useRouter();
  const modules = [...initial].sort((a, b) => a.order - b.order);

  async function reorder(ordered: ModuleRow[]) {
    await fetch("/api/modules/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered.map((m) => m.id) }),
    });
    router.refresh();
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= modules.length) return;
    const next = [...modules];
    const t = next[i]!;
    next[i] = next[j]!;
    next[j] = t;
    reorder(next);
  }

  return (
    <ul className="space-y-3">
      {modules.map((m, i) => (
        <li
          key={m.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-900">{m.title}</h2>
              <Badge variant={m.published ? "success" : "warning"}>
                {m.published ? "Dərc" : "Qaralama"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{m._count.lessons} dərs</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => move(i, -1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => move(i, 1)}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Link
              href={`/admin/modules/${m.id}/edit`}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Redaktə
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

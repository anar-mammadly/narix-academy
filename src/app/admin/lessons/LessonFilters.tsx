"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

export function LessonFilters({
  modules,
}: {
  modules: { id: string; title: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.push(`/admin/lessons?${next.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-[200px] flex-1">
        <Label>Axtarış</Label>
        <Input
          defaultValue={sp.get("q") ?? ""}
          placeholder="Dərs başlığı…"
          className="mt-1"
          onBlur={(e) => update("q", e.target.value.trim())}
          disabled={pending}
        />
      </div>
      <div>
        <Label>Modul</Label>
        <select
          className="mt-1 h-10 w-full min-w-[160px] rounded-lg border border-slate-200 px-3 text-sm"
          value={sp.get("moduleId") ?? ""}
          onChange={(e) => update("moduleId", e.target.value)}
          disabled={pending}
        >
          <option value="">Hamısı</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Dərc</Label>
        <select
          className="mt-1 h-10 w-full min-w-[140px] rounded-lg border border-slate-200 px-3 text-sm"
          value={sp.get("published") ?? ""}
          onChange={(e) => update("published", e.target.value)}
          disabled={pending}
        >
          <option value="">Hamısı</option>
          <option value="true">Dərc edilib</option>
          <option value="false">Qaralama</option>
        </select>
      </div>
    </div>
  );
}

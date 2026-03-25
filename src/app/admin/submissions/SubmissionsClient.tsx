"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";

type Sub = {
  id: string;
  answer: string;
  createdAt: string;
  user: { name: string; email: string };
  lesson: { title: string; slug: string };
  block: { title: string | null };
};

export function SubmissionsClient({
  lessons,
  students,
}: {
  lessons: { id: string; title: string }[];
  students: { id: string; name: string }[];
}) {
  const [lessonId, setLessonId] = useState("");
  const [userId, setUserId] = useState("");
  const [list, setList] = useState<Sub[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams();
    if (lessonId) q.set("lessonId", lessonId);
    if (userId) q.set("userId", userId);
    fetch(`/api/submissions?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => setList(d.submissions || []));
  }, [lessonId, userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dərs</label>
          <select
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">Hamısı</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tələbə</label>
          <select
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Hamısı</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="space-y-3">
        {list.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            📭 Təqdimat tapılmadı
          </li>
        ) : (
          list.map((s) => (
            <li key={s.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium text-slate-900">{s.user.name}</p>
                  <p className="text-sm text-slate-600">
                    {s.lesson.title} · {s.block.title || "Tapşırıq"}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString("az-AZ")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  {open === s.id ? (
                    <>
                      Gizlət <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Tam mətn <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              {open === s.id ? (
                <div className="border-t border-slate-100 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap animate-fade-in">
                  {s.answer}
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

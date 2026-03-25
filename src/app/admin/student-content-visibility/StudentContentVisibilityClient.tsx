"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type StudentRow = { id: string; name: string; email: string };
type ModuleLessonRow = { id: string; title: string; order: number };
type ModuleRow = { id: string; title: string; description: string | null; order: number; lessons: ModuleLessonRow[] };

type RulesResponse = {
  studentId: string;
  hiddenModuleIds: string[];
  hiddenLessonIds: string[];
};

export function StudentContentVisibilityClient({ students, modules }: { students: StudentRow[]; modules: ModuleRow[] }) {
  const [studentId, setStudentId] = useState<string>(students[0]?.id ?? "");
  const [hiddenModuleIds, setHiddenModuleIds] = useState<string[]>([]);
  const [hiddenLessonIds, setHiddenLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/student-content-visibility?studentId=${encodeURIComponent(studentId)}`);
        const data = (await res.json()) as unknown;
        if (!res.ok) {
          const maybeError = data as { error?: unknown };
          const err = typeof maybeError?.error === "string" ? maybeError.error : "Xəta baş verdi";
          setMsg(err);
          return;
        }
        const okData = data as RulesResponse;
        setHiddenModuleIds(okData.hiddenModuleIds ?? []);
        setHiddenLessonIds(okData.hiddenLessonIds ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const hiddenModuleSet = useMemo(() => new Set(hiddenModuleIds), [hiddenModuleIds]);
  const hiddenLessonSet = useMemo(() => new Set(hiddenLessonIds), [hiddenLessonIds]);

  async function save() {
    if (!studentId) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/student-content-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, hiddenModuleIds, hiddenLessonIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Xəta baş verdi");
        return;
      }
      setMsg("Qaydalar saxlanıldı.");
    } finally {
      setSaving(false);
    }
  }

  function setModuleVisible(moduleId: string, visible: boolean) {
    setHiddenModuleIds((prev) => {
      const set = new Set(prev);
      if (visible) set.delete(moduleId);
      else set.add(moduleId);
      return Array.from(set);
    });
  }

  function setLessonVisible(lessonId: string, visible: boolean) {
    setHiddenLessonIds((prev) => {
      const set = new Set(prev);
      if (visible) set.delete(lessonId);
      else set.add(lessonId);
      return Array.from(set);
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student content visibility</h1>
        <p className="mt-1 text-sm text-slate-600">Hər tələbə üçün modul və dərs görünüş qaydalarını idarə edin.</p>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-1">
            <Label>Tələbə seçin</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={loading || saving}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <Label>İzah</Label>
            <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Default olaraq hər şey görünür. Yalnız “Gizlət” etdiyiniz elementlər tələbədən gizlədilir.
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={!studentId || loading || saving}>
            {saving ? "Saxlanır…" : "Qaydaları saxla"}
          </Button>
          {msg ? <span className="text-sm text-slate-600">{msg}</span> : null}
        </div>
      </Card>

      <div className="space-y-4">
        {modules.map((mod) => {
          const moduleVisible = !hiddenModuleSet.has(mod.id);
          return (
            <Card key={mod.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-800">
                    <input
                      type="checkbox"
                      checked={moduleVisible}
                      onChange={(e) => setModuleVisible(mod.id, e.target.checked)}
                      disabled={loading || saving}
                    />
                    {moduleVisible ? "Görünür" : "Gizlədilir"}
                  </label>
                  <div>
                    <p className="font-semibold text-slate-900">{mod.title}</p>
                    {mod.description ? <p className="text-sm text-slate-600">{mod.description}</p> : null}
                  </div>
                </div>
              </div>

              {mod.lessons.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lessons</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {mod.lessons.map((lesson) => {
                      const lessonVisible = !hiddenLessonSet.has(lesson.id);
                      return (
                        <label
                          key={lesson.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={lessonVisible}
                            disabled={!moduleVisible || loading || saving}
                            onChange={(e) => setLessonVisible(lesson.id, e.target.checked)}
                          />
                          <span className={moduleVisible ? "" : "opacity-50"}>{lesson.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}


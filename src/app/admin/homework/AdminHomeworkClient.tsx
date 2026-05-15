"use client";

import { useState } from "react";
import { ClipboardList, Plus, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminHomeworkClient({ homeworks: init, lessons }: { homeworks: any[]; lessons: any[] }) {
  const [homeworks, setHomeworks] = useState(init);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ lessonId: "", title: "", description: "", dueDate: "" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({});

  async function createHomework() {
    if (!form.lessonId || !form.title.trim()) return;
    const res = await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const hw = await res.json();
    const lesson = lessons.find(l => l.id === form.lessonId);
    setHomeworks([{ ...hw, lesson, submits: [] }, ...homeworks]);
    setForm({ lessonId: "", title: "", description: "", dueDate: "" });
    setShowNew(false);
  }

  async function gradeSubmit(submitId: string, homeworkId: string) {
    const g = grades[submitId];
    if (!g?.grade) return;
    await fetch(`/api/homework/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submitId, grade: parseInt(g.grade), feedback: g.feedback ?? "" }),
    });
    setHomeworks(homeworks.map(hw =>
      hw.id === homeworkId ? {
        ...hw,
        submits: hw.submits.map((s: any) =>
          s.id === submitId ? { ...s, grade: parseInt(g.grade), feedback: g.feedback, status: "GRADED" } : s
        )
      } : hw
    ));
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-blue-600" /> Tapşırıqlar
          </h1>
          <p className="text-muted mt-1">Ev tapşırıqlarını idarə et və qiymətləndir</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary">
          <Plus size={16} /> Tapşırıq əlavə et
        </button>
      </div>

      {/* New homework form */}
      {showNew && (
        <div className="card space-y-4 border-blue-200 slide-up">
          <h2 className="font-bold text-gray-900">Yeni tapşırıq</h2>
          <div>
            <label className="label">Dərs</label>
            <select className="input" value={form.lessonId} onChange={e => setForm({ ...form, lessonId: e.target.value })}>
              <option value="">Dərs seç...</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Başlıq</label>
            <input className="input" placeholder="Tapşırığın adı" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Təsvir</label>
            <textarea className="textarea h-24" placeholder="Tapşırığın şərtləri..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Son tarix (isteğe bağlı)</label>
            <input type="datetime-local" className="input" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={createHomework} disabled={!form.lessonId || !form.title.trim()} className="btn-primary">
              Yarat
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary">Ləğv et</button>
          </div>
        </div>
      )}

      {/* Homeworks list */}
      {homeworks.length === 0 ? (
        <div className="card text-center text-muted py-10">Hələ tapşırıq yoxdur</div>
      ) : (
        <div className="space-y-4">
          {homeworks.map(hw => {
            const pending = hw.submits.filter((s: any) => s.status === "SUBMITTED" && s.grade === null);
            return (
              <div key={hw.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900">{hw.title}</div>
                    <div className="text-xs text-muted mt-0.5">Dərs: {hw.lesson?.title}</div>
                    {hw.dueDate && (
                      <div className="text-xs text-muted mt-0.5">
                        Son tarix: {new Date(hw.dueDate).toLocaleDateString("az-AZ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {pending.length > 0 && (
                      <div className="badge badge-yellow">{pending.length} gözlənilir</div>
                    )}
                    <span className="text-xs text-muted">{hw.submits.length} cavab</span>
                    <button onClick={() => setExpanded(expanded === hw.id ? null : hw.id)} className="btn-ghost btn-sm">
                      {expanded === hw.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {expanded === hw.id && (
                  <div className="border-t border-gray-100 pt-3 space-y-3">
                    {hw.submits.length === 0 ? (
                      <div className="text-sm text-muted text-center py-4">Hələ cavab yoxdur</div>
                    ) : (
                      hw.submits.map((sub: any) => (
                        <div key={sub.id} className={cn("rounded-xl p-4 space-y-3", sub.grade !== null ? "bg-green-50" : "bg-gray-50")}>
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-gray-900">{sub.user.name}</div>
                            {sub.grade !== null ? (
                              <div className="badge badge-green">{sub.grade}/100</div>
                            ) : (
                              <div className="badge badge-yellow">Qiymətləndirilməyib</div>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 bg-white rounded-lg p-3">{sub.content}</div>
                          {sub.feedback && (
                            <div className="text-xs text-gray-600 italic">💬 {sub.feedback}</div>
                          )}
                          {sub.grade === null && (
                            <div className="flex gap-2 items-end">
                              <div className="w-24">
                                <label className="label text-xs">Qiymət (/100)</label>
                                <input type="number" min="0" max="100" className="input text-sm py-1.5"
                                  placeholder="85"
                                  value={grades[sub.id]?.grade ?? ""}
                                  onChange={e => setGrades({ ...grades, [sub.id]: { ...grades[sub.id], grade: e.target.value } })} />
                              </div>
                              <div className="flex-1">
                                <label className="label text-xs">Rəy</label>
                                <input className="input text-sm py-1.5" placeholder="Gözəl iş..."
                                  value={grades[sub.id]?.feedback ?? ""}
                                  onChange={e => setGrades({ ...grades, [sub.id]: { ...grades[sub.id], feedback: e.target.value } })} />
                              </div>
                              <button onClick={() => gradeSubmit(sub.id, hw.id)} className="btn-primary btn-sm shrink-0">
                                <Check size={13} /> Qiymətləndir
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

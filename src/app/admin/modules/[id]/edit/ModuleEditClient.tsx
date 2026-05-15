"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModuleEditClient({ module: mod }: { module: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: mod.title,
    titleEn: mod.titleEn ?? "",
    description: mod.description ?? "",
    descriptionEn: mod.descriptionEn ?? "",
    published: mod.published,
  });
  const [lessons, setLessons] = useState(mod.lessons);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: "", titleEn: "", shortDescription: "", estimatedMinutes: 30, quizEnabled: false, published: false });
  const [creatingLesson, setCreatingLesson] = useState(false);

  async function saveModule() {
    setSaving(true);
    await fetch(`/api/modules/${mod.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function deleteModule() {
    if (!confirm(`"${mod.title}" modulunu silmək istədiyinizdən əminsiniz? Bütün dərslər də silinəcək!`)) return;
    await fetch(`/api/modules/${mod.id}`, { method: "DELETE" });
    router.push("/admin/modules");
  }

  async function createLesson() {
    if (!newLesson.title.trim()) return;
    setCreatingLesson(true);
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newLesson, moduleId: mod.id }),
    });
    const lesson = await res.json();
    setLessons([...lessons, lesson]);
    setNewLesson({ title: "", titleEn: "", shortDescription: "", estimatedMinutes: 30, quizEnabled: false, published: false });
    setShowNewLesson(false);
    setCreatingLesson(false);
  }

  async function toggleLessonPublish(lessonId: string, published: boolean) {
    await fetch(`/api/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    setLessons(lessons.map((l: any) => l.id === lessonId ? { ...l, published: !published } : l));
  }

  async function deleteLesson(lessonId: string, title: string) {
    if (!confirm(`"${title}" dərsini silmək istədiyinizdən əminsiniz?`)) return;
    await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" });
    setLessons(lessons.filter((l: any) => l.id !== lessonId));
  }

  return (
    <div className="max-w-3xl space-y-6 fade-in">
      <div>
        <Link href="/admin/modules" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Modullara qayıt
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Modulu düzəlt</h1>
          <button onClick={deleteModule} className="btn-danger btn-sm">
            <Trash2 size={14} /> Sil
          </button>
        </div>
      </div>

      {/* Module form */}
      <div className="card space-y-5">
        <h2 className="font-bold text-gray-900">Modul məlumatları</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Başlıq (AZ) *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Başlıq (EN)</label>
            <input className="input" value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Təsvir (AZ)</label>
          <textarea className="textarea h-20" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Təsvir (EN)</label>
          <textarea className="textarea h-20" value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="pub" className="w-4 h-4 rounded"
            checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
          <label htmlFor="pub" className="text-sm font-medium text-gray-700 cursor-pointer">Yayımlanıb</label>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveModule} disabled={saving} className="btn-primary">
            {saving ? "Saxlanılır..." : "Saxla"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium fade-in">✓ Saxlanıldı</span>}
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Dərslər ({lessons.length})</h2>
          <button onClick={() => setShowNewLesson(!showNewLesson)} className="btn-primary btn-sm">
            <Plus size={14} /> Dərs əlavə et
          </button>
        </div>

        {/* New lesson form */}
        {showNewLesson && (
          <div className="card border-blue-200 space-y-4 slide-up">
            <h3 className="font-semibold text-gray-900">Yeni dərs</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Başlıq (AZ) *</label>
                <input className="input" placeholder="Dərsin adı..."
                  value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Başlıq (EN)</label>
                <input className="input" placeholder="Lesson title..."
                  value={newLesson.titleEn} onChange={e => setNewLesson({ ...newLesson, titleEn: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Qısa təsvir</label>
              <input className="input" placeholder="Dərs nə haqqındadır..."
                value={newLesson.shortDescription} onChange={e => setNewLesson({ ...newLesson, shortDescription: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Təxmini müddət (dəq)</label>
                <input type="number" className="input" min={5} max={300}
                  value={newLesson.estimatedMinutes} onChange={e => setNewLesson({ ...newLesson, estimatedMinutes: parseInt(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded"
                    checked={newLesson.quizEnabled} onChange={e => setNewLesson({ ...newLesson, quizEnabled: e.target.checked })} />
                  <span className="text-sm font-medium text-gray-700">Quiz aktiv</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded"
                    checked={newLesson.published} onChange={e => setNewLesson({ ...newLesson, published: e.target.checked })} />
                  <span className="text-sm font-medium text-gray-700">Dərhal yayımla</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createLesson} disabled={creatingLesson || !newLesson.title.trim()} className="btn-primary">
                {creatingLesson ? "Yaradılır..." : "Dərs yarat"}
              </button>
              <button onClick={() => setShowNewLesson(false)} className="btn-secondary">Ləğv et</button>
            </div>
          </div>
        )}

        {/* Lessons list */}
        {lessons.length === 0 ? (
          <div className="card text-center text-muted py-8">Hələ dərs yoxdur</div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: any, i: number) => (
              <div key={lesson.id} className="card flex items-center gap-3 py-3 px-4">
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{lesson.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted">{lesson.estimatedMinutes} dəq</span>
                    {lesson.quizEnabled && <span className="badge badge-blue text-xs">Quiz</span>}
                    {!lesson.published && <span className="badge badge-gray text-xs">Qaralama</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleLessonPublish(lesson.id, lesson.published)}
                    className={cn("btn-ghost btn-sm", lesson.published ? "text-green-600" : "text-gray-400")}
                    title={lesson.published ? "Geri çək" : "Yayımla"}>
                    {lesson.published ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <Link href={`/admin/lessons/${lesson.id}/edit`} className="btn-ghost btn-sm text-blue-600">
                    <Edit size={15} />
                  </Link>
                  <button onClick={() => deleteLesson(lesson.id, lesson.title)} className="btn-ghost btn-sm text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

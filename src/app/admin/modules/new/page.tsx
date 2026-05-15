"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function NewModulePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", titleEn: "", description: "", descriptionEn: "", published: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Xəta");
      setLoading(false);
      return;
    }
    router.push("/admin/modules");
  }

  return (
    <div className="max-w-2xl space-y-6 fade-in">
      <div>
        <Link href="/admin/modules" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Modullara qayıt
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen size={24} className="text-blue-600" /> Yeni modul
        </h1>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Başlıq (AZ) *</label>
            <input className="input" placeholder="Modulun adı..." required
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Başlıq (EN)</label>
            <input className="input" placeholder="Module title..."
              value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Təsvir (AZ)</label>
          <textarea className="textarea h-24" placeholder="Modulun məzmunu haqqında..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="label">Təsvir (EN)</label>
          <textarea className="textarea h-24" placeholder="About this module..."
            value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="published" className="w-4 h-4 rounded"
            checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
          <label htmlFor="published" className="text-sm font-medium text-gray-700 cursor-pointer">
            Dərhal yayımla
          </label>
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Yaradılır..." : "Modul yarat"}
          </button>
          <Link href="/admin/modules" className="btn-secondary">Ləğv et</Link>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push("/admin/students");
  }

  return (
    <div className="max-w-md space-y-6 fade-in">
      <div>
        <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Tələbələrə qayıt
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserPlus size={24} className="text-blue-600" /> Yeni tələbə
        </h1>
      </div>
      <div className="card">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Ad Soyad</label>
            <input className="input" placeholder="Tələbənin adı" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">E-poçt</label>
            <input type="email" className="input" placeholder="telebе@qa.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Şifrə</label>
            <input type="password" className="input" placeholder="Ən azı 8 simvol" required minLength={6}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Əlavə edilir..." : "Tələbəni əlavə et"}
          </button>
        </form>
      </div>
    </div>
  );
}

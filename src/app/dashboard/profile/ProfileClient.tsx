"use client";

import { useState } from "react";
import { User, Globe, Save } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function ProfileClient({ user }: { user: any }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio ?? "", phone: user.phone ?? "", language: user.language });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Refresh language in session
    if (form.language !== user.language) window.location.reload();
  }

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User size={24} className="text-blue-600" /> Profil
        </h1>
        <p className="text-muted mt-1">Şəxsi məlumatlarınızı idarə edin</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {getInitials(form.name)}
        </div>
        <div>
          <div className="font-bold text-gray-900">{form.name}</div>
          <div className="text-sm text-muted">{user.email}</div>
          <div className="text-xs text-muted mt-0.5">
            Qeydiyyat: {new Date(user.createdAt).toLocaleDateString("az-AZ")}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-900">Məlumatları yenilə</h2>
        <div>
          <label className="label">Ad Soyad</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="textarea h-20" placeholder="Özünüz haqqında..."
            value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" placeholder="+994 50 123 45 67" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label flex items-center gap-1.5"><Globe size={14} /> Platforma dili</label>
          <div className="flex gap-2">
            {["az", "en"].map(lang => (
              <button key={lang} onClick={() => setForm({ ...form, language: lang })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.language === lang ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                {lang === "az" ? "🇦🇿 Azərbaycan" : "🇬🇧 English"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save size={15} /> {saving ? "Saxlanılır..." : "Saxla"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium fade-in">✓ Saxlanıldı</span>}
        </div>
      </div>
    </div>
  );
}

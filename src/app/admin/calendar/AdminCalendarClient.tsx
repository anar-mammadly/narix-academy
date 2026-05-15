"use client";

import { useState } from "react";
import { Calendar, Plus, Trash2, Video, BookOpen, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "CLASS", label: "Dərs", icon: BookOpen },
  { value: "EXAM", label: "İmtahan", icon: AlertCircle },
  { value: "DEADLINE", label: "Son tarix", icon: Clock },
  { value: "OTHER", label: "Digər", icon: Calendar },
];

const TYPE_BADGE: Record<string, string> = {
  CLASS: "badge-blue", EXAM: "badge-red", DEADLINE: "badge-yellow", OTHER: "badge-gray",
};

export default function AdminCalendarClient({ events: init, teacherId }: { events: any[]; teacherId: string }) {
  const [events, setEvents] = useState(init);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startAt: "", endAt: "", type: "CLASS", meetLink: "" });

  async function create() {
    if (!form.title.trim() || !form.startAt) return;
    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const ev = await res.json();
    setEvents([{ ...ev, createdBy: { name: "Müəllim" } }, ...events]);
    setForm({ title: "", description: "", startAt: "", endAt: "", type: "CLASS", meetLink: "" });
    setShowNew(false);
  }

  async function remove(id: string) {
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    setEvents(events.filter(e => e.id !== id));
  }

  const upcoming = events.filter(e => new Date(e.startAt) >= new Date());
  const past = events.filter(e => new Date(e.startAt) < new Date());

  function EventRow({ event }: { event: any }) {
    const typeCfg = TYPES.find(t => t.value === event.type) ?? TYPES[0];
    return (
      <div className="flex items-center gap-4 py-3 px-4 hover:bg-gray-50 transition-colors rounded-xl">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{event.title}</span>
            <div className={`badge ${TYPE_BADGE[event.type] ?? "badge-gray"}`}>{typeCfg.label}</div>
          </div>
          <div className="text-xs text-muted mt-0.5">
            {new Date(event.startAt).toLocaleString("az-AZ", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
          {event.meetLink && (
            <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
              <Video size={11} /> Meet linki
            </a>
          )}
        </div>
        <button onClick={() => remove(event.id)} className="btn-ghost btn-sm text-red-400 hover:text-red-600 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={24} className="text-blue-600" /> Təqvim
          </h1>
          <p className="text-muted mt-1">Dərs, imtahan və deadline əlavə et</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary">
          <Plus size={16} /> Tədbir əlavə et
        </button>
      </div>

      {showNew && (
        <div className="card border-blue-200 space-y-4 slide-up">
          <h2 className="font-bold text-gray-900">Yeni tədbir</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Başlıq</label>
              <input className="input" placeholder="Dərsin mövzusu..."
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Növ</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Başlama vaxtı</label>
              <input type="datetime-local" className="input"
                value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} />
            </div>
            <div>
              <label className="label">Bitmə vaxtı (isteğe bağlı)</label>
              <input type="datetime-local" className="input"
                value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} />
            </div>
            <div>
              <label className="label">Meet linki (isteğe bağlı)</label>
              <input className="input" placeholder="https://meet.google.com/..."
                value={form.meetLink} onChange={e => setForm({ ...form, meetLink: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Qeyd (isteğe bağlı)</label>
              <textarea className="textarea h-16" placeholder="Əlavə məlumat..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={!form.title.trim() || !form.startAt} className="btn-primary">Əlavə et</button>
            <button onClick={() => setShowNew(false)} className="btn-secondary">Ləğv et</button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Gələcək tədbirlər ({upcoming.length})</h2>
          </div>
          <div className="p-2">
            {upcoming.map(e => <EventRow key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="card p-0 overflow-hidden opacity-70">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="font-bold text-gray-500 text-sm">Keçmiş tədbirlər ({past.length})</h2>
          </div>
          <div className="p-2">
            {past.slice(0, 10).map(e => <EventRow key={e.id} event={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}

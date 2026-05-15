"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Send, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuestionsClient({ questions: initial, session }: { questions: any[]; session: any }) {
  const [questions, setQuestions] = useState(initial);
  const [form, setForm] = useState({ title: "", body: "" });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "open" | "answered">("all");

  const filtered = questions.filter(q =>
    filter === "all" ? true : filter === "open" ? q.status === "OPEN" : q.status === "ANSWERED"
  );

  async function submit() {
    if (!form.title.trim()) return;
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const q = await res.json();
    setQuestions([{ ...q, user: { name: session.name, role: session.role }, lesson: null, replies: [] }, ...questions]);
    setForm({ title: "", body: "" });
  }

  async function submitReply(qId: string) {
    const body = replies[qId]?.trim();
    if (!body) return;
    const res = await fetch(`/api/questions/${qId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const r = await res.json();
    setQuestions(questions.map(q =>
      q.id === qId ? { ...q, replies: [...q.replies, { ...r, user: { name: session.name, role: session.role } }] } : q
    ));
    setReplies({ ...replies, [qId]: "" });
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle size={24} className="text-blue-600" /> Suallar
        </h1>
        <p className="text-muted mt-1">Müəllimə və ya sinif yoldaşlarına sual ver</p>
      </div>

      {/* New question */}
      <div className="card space-y-3">
        <h2 className="font-bold text-gray-900">Yeni sual</h2>
        <div>
          <label className="label">Başlıq</label>
          <input className="input" placeholder="Sualın mövzusu..."
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Sual (isteğe bağlı)</label>
          <textarea className="textarea h-20" placeholder="Ətraflı izahat..."
            value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
        </div>
        <button onClick={submit} disabled={!form.title.trim()} className="btn-primary">
          <Send size={15} /> Sual göndər
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "open", "answered"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("btn-secondary btn-sm", filter === f && "bg-blue-700 text-white border-blue-700 hover:bg-blue-800")}>
            {f === "all" ? "Hamısı" : f === "open" ? "Açıq" : "Cavablandı"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center text-muted py-10">Sual tapılmadı</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="card space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.pinned && <Pin size={13} className="text-blue-600" />}
                    <span className="font-semibold text-gray-900">{q.title}</span>
                    <div className={`badge ${q.status === "ANSWERED" ? "badge-green" : "badge-gray"}`}>
                      {q.status === "ANSWERED" ? "Cavablandı" : "Açıq"}
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {q.user.name} {q.lesson && <>• <span className="text-blue-600">{q.lesson.title}</span></>}
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="btn-ghost btn-sm shrink-0">
                  {expanded === q.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  <span className="text-xs">{q.replies.length}</span>
                </button>
              </div>

              {q.body && <p className="text-sm text-gray-700">{q.body}</p>}

              {expanded === q.id && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {q.replies.map((r: any) => (
                    <div key={r.id} className={cn("rounded-xl p-3 text-sm", r.user.role === "TEACHER" ? "bg-blue-50 border border-blue-100" : "bg-gray-50")}>
                      <div className="text-xs font-semibold text-muted mb-1">
                        {r.user.role === "TEACHER" ? "👨‍🏫 " : ""}{r.user.name}
                      </div>
                      <div className="text-gray-700">{r.body}</div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input className="input flex-1" placeholder="Cavab yaz..."
                      value={replies[q.id] ?? ""}
                      onChange={e => setReplies({ ...replies, [q.id]: e.target.value })} />
                    <button onClick={() => submitReply(q.id)} className="btn-primary btn-sm">
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Send, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminQuestionsClient({ questions: init }: { questions: any[] }) {
  const [questions, setQuestions] = useState(init);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "OPEN" | "ANSWERED">("OPEN");

  const filtered = questions.filter(q => filter === "all" ? true : q.status === filter);

  async function submitReply(qId: string) {
    const body = replies[qId]?.trim();
    if (!body) return;
    await fetch(`/api/questions/${qId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setQuestions(questions.map(q =>
      q.id === qId ? { ...q, status: "ANSWERED", replies: [...q.replies, { id: Date.now(), body, user: { name: "Müəllim" } }] } : q
    ));
    setReplies({ ...replies, [qId]: "" });
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle size={24} className="text-blue-600" /> Tələbə Sualları
        </h1>
        <p className="text-muted mt-1">Sualları cavablandır və ya bağla</p>
      </div>

      <div className="flex gap-2">
        {(["OPEN", "ANSWERED", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("btn-secondary btn-sm", filter === f && "bg-blue-700 text-white border-blue-700")}>
            {f === "OPEN" ? `Açıq (${questions.filter(q => q.status === "OPEN").length})` : f === "ANSWERED" ? "Cavablandı" : "Hamısı"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-muted py-10">Sual yoxdur</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className={cn("card space-y-2", q.status === "OPEN" && "border-orange-200")}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{q.title}</div>
                  <div className="text-xs text-muted">{q.user.name} {q.lesson && `• ${q.lesson.title}`}</div>
                  {q.body && <p className="text-sm text-gray-700 mt-1">{q.body}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`badge ${q.status === "ANSWERED" ? "badge-green" : "badge-yellow"}`}>
                    {q.status === "ANSWERED" ? "Cavablandı" : "Açıq"}
                  </div>
                  <button onClick={() => setExpanded(expanded === q.id ? null : q.id)} className="btn-ghost btn-sm">
                    {expanded === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {expanded === q.id && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  {q.replies.map((r: any) => (
                    <div key={r.id} className="bg-blue-50 rounded-xl p-3 text-sm">
                      <div className="font-semibold text-xs text-muted mb-1">{r.user.name}</div>
                      <div>{r.body}</div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Cavab yaz..."
                      value={replies[q.id] ?? ""}
                      onChange={e => setReplies({ ...replies, [q.id]: e.target.value })} />
                    <button onClick={() => submitReply(q.id)} className="btn-primary btn-sm">
                      <Send size={13} /> Cavabla
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

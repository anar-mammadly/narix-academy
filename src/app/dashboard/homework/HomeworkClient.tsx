"use client";

import { useState } from "react";
import { ClipboardList, Send, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomeworkClient({ homeworks, userId }: { homeworks: any[]; userId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set(
    homeworks.filter(h => h.submits.length > 0).map(h => h.id)
  ));

  async function submit(homeworkId: string) {
    const content = answers[homeworkId];
    if (!content?.trim()) return;
    await fetch("/api/homework/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId, content }),
    });
    setSubmitted(prev => new Set([...prev, homeworkId]));
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList size={24} className="text-blue-600" /> Tapşırıqlar
        </h1>
        <p className="text-muted mt-1">Ev tapşırıqları və onların statusu</p>
      </div>

      {homeworks.length === 0 ? (
        <div className="card text-center text-muted py-10">Hələ tapşırıq yoxdur</div>
      ) : (
        <div className="space-y-4">
          {homeworks.map(hw => {
            const done = submitted.has(hw.id);
            const mySubmit = hw.submits[0];
            const overdue = hw.dueDate && new Date(hw.dueDate) < new Date() && !done;

            return (
              <div key={hw.id} className="card space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{hw.title}</span>
                      {done ? (
                        <div className="badge badge-green"><CheckCircle2 size={11} /> Göndərildi</div>
                      ) : overdue ? (
                        <div className="badge badge-red">Gecikmiş</div>
                      ) : (
                        <div className="badge badge-yellow">Gözlənilir</div>
                      )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">Dərs: {hw.lesson.title}</div>
                    {hw.dueDate && (
                      <div className={cn("flex items-center gap-1 text-xs mt-1", overdue ? "text-red-500" : "text-muted")}>
                        <Clock size={11} /> Son tarix: {new Date(hw.dueDate).toLocaleDateString("az-AZ")}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700">{hw.description}</p>

                {done ? (
                  <div className="bg-green-50 rounded-xl p-4 text-sm space-y-1">
                    <div className="font-semibold text-green-800">Cavabınız:</div>
                    <div className="text-gray-700">{mySubmit?.content}</div>
                    {mySubmit?.grade !== null && mySubmit?.grade !== undefined && (
                      <div className="mt-2 font-semibold text-blue-700">Qiymət: {mySubmit.grade}/100</div>
                    )}
                    {mySubmit?.feedback && (
                      <div className="text-gray-600 text-xs mt-1">💬 {mySubmit.feedback}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      className="textarea h-28"
                      placeholder="Cavabınızı buraya yazın..."
                      value={answers[hw.id] ?? ""}
                      onChange={e => setAnswers({ ...answers, [hw.id]: e.target.value })}
                    />
                    <button onClick={() => submit(hw.id)} disabled={!answers[hw.id]?.trim()} className="btn-primary btn-sm">
                      <Send size={13} /> Göndər
                    </button>
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

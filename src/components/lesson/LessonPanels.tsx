"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatDate } from "@/lib/utils";

/** Personal note for the lesson, saved automatically. */
export function NotesPanel({ lessonId, initial, previewMode }: { lessonId: string; initial: string; previewMode: boolean }) {
  const [text, setText] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function change(value: string) {
    setText(value);
    if (previewMode) return;
    setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, content: value }),
        });
        setState(res.ok ? "saved" : "error");
      } catch {
        setState("error");
      }
    }, 800);
  }

  return (
    <div>
      <label htmlFor="lesson-note" className="mb-2 block text-sm text-muted">Yalnız sən görürsən. Yazdıqca yadda saxlanılır.</label>
      <Textarea id="lesson-note" rows={14} value={text} onChange={(e) => change(e.target.value)} placeholder="Vacib fikirlər, suallar, nümunələr…" />
      <p className="mt-2 h-5 text-sm" aria-live="polite">
        {state === "saving" && <span className="text-muted">Yadda saxlanılır…</span>}
        {state === "saved" && <span className="flex items-center gap-1 text-pass"><CheckCircle2 className="h-4 w-4" aria-hidden /> Saxlanıldı</span>}
        {state === "error" && <span className="text-bug">Saxlanılmadı. İnterneti yoxla.</span>}
      </p>
    </div>
  );
}

export type QuestionItem = {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string | Date;
  user: { name: string; role?: string };
  replies: { id: string; body: string; isTeacher: boolean; createdAt: string | Date; user: { name: string } }[];
};

export function QuestionsPanel({
  lessonId, initial, previewMode, userName,
}: { lessonId: string; initial: QuestionItem[]; previewMode: boolean; userName: string }) {
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (title.trim().length < 3) { setError("Başlıq ən az 3 simvol olmalıdır"); return; }
    setPending(true);
    setError(null);
    try {
      let created: QuestionItem;
      if (previewMode) {
        created = { id: `p-${Date.now()}`, title, body, status: "OPEN", createdAt: new Date(), user: { name: userName }, replies: [] };
      } else {
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, title, body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Göndərilmədi");
        created = { ...data, user: { name: userName }, replies: [] };
      }
      setItems([created, ...items]);
      setTitle("");
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Göndərilmədi");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 rounded-lg border border-line bg-surface-2/50 p-3">
        <label htmlFor="q-title" className="text-sm font-medium text-ink-2">Müəllimə sual ver</label>
        <Input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sualın qısa başlığı" maxLength={140} />
        <Textarea aria-label="Ətraflı" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Nəyi başa düşmədin? (istəyə görə)" />
        {error && <p role="alert" className="text-sm text-bug">{error}</p>}
        <Button onClick={ask} disabled={title.trim().length < 3} loading={pending} className="justify-self-end"><Send className="h-4 w-4" aria-hidden /> Göndər</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Hələ sual yoxdur" description="İlk sualı sən ver — müəllim cavablandıracaq." />
      ) : (
        <ul className="grid gap-3">
          {items.map((q) => (
            <li key={q.id} className="rounded-lg border border-line p-3.5">
              <div className="flex items-start gap-3">
                <Avatar name={q.user.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{q.title}</p>
                    <Badge tone={q.status === "ANSWERED" ? "pass" : "neutral"}>{q.status === "ANSWERED" ? "Cavablandı" : "Açıq"}</Badge>
                  </div>
                  <p className="text-xs text-muted">{q.user.name} · {formatDate(q.createdAt)}</p>
                  {q.body && <p className="mt-1.5 whitespace-pre-line text-sm text-ink-2">{q.body}</p>}
                </div>
              </div>
              {q.replies.length > 0 && (
                <ul className="mt-3 grid gap-2 border-l-2 border-line pl-3">
                  {q.replies.map((r) => (
                    <li key={r.id} className={cn("rounded-md p-2.5 text-sm", r.isTeacher ? "bg-iris-soft" : "bg-surface-2")}>
                      <p className="mb-0.5 text-xs font-semibold text-ink">{r.user.name}{r.isTeacher && " · Müəllim"}</p>
                      <p className="whitespace-pre-line text-ink-2">{r.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { az } from "date-fns/locale";
import { BookOpen, ChevronDown, Lock, MessageCircle, Pin, PinOff, Search, Send, Unlock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { errorMessage, requestJson } from "@/components/admin/request";
import { cn } from "@/lib/utils";

type Status = "OPEN" | "ANSWERED" | "CLOSED";
type Person = { name: string; avatarUrl: string | null };
export type Reply = { id: string; body: string; isTeacher: boolean; createdAt: string; user: Person };
export type QuestionItem = {
  id: string;
  title: string;
  body: string;
  status: Status;
  pinned: boolean;
  createdAt: string;
  user: Person;
  lessonTitle: string | null;
  replies: Reply[];
};

const STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  OPEN: { label: "Açıq", tone: "flame" },
  ANSWERED: { label: "Cavablandı", tone: "pass" },
  CLOSED: { label: "Bağlı", tone: "neutral" },
};

const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: az });

function Thread({ q, onChange }: { q: QuestionItem; onChange: (q: QuestionItem) => void }) {
  const toast = useToast();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<"pin" | "status" | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    try {
      const r = await requestJson<{ id: string; body: string; isTeacher: boolean; createdAt: string; user: { name: string } }>(`/api/questions/${q.id}/replies`, "POST", { body });
      onChange({ ...q, status: "ANSWERED", replies: [...q.replies, { id: r.id, body: r.body, isTeacher: true, createdAt: r.createdAt, user: { name: r.user.name, avatarUrl: null } }] });
      setReply("");
      toast({ title: "Cavab göndərildi", variant: "success" });
    } catch (err) {
      toast({ title: "Göndərilmədi", description: errorMessage(err), variant: "error" });
    } finally {
      setSending(false);
    }
  }

  async function patch(data: { status?: Status; pinned?: boolean }, kind: "pin" | "status") {
    setBusy(kind);
    try {
      await requestJson(`/api/questions/${q.id}`, "PATCH", data);
      onChange({ ...q, ...data });
    } catch (err) {
      toast({ title: "Dəyişmədi", description: errorMessage(err), variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {q.body && <p className="whitespace-pre-wrap break-words text-sm text-ink-2">{q.body}</p>}

      {q.replies.length > 0 && (
        <ol className="space-y-3">
          {q.replies.map((r) => (
            <li key={r.id} className={cn("flex gap-2.5", r.isTeacher && "flex-row-reverse")}>
              <Avatar name={r.user.name} src={r.user.avatarUrl} size="sm" />
              <div className={cn("min-w-0 max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm", r.isTeacher ? "bg-iris-soft text-ink" : "bg-surface-2 text-ink-2")}>
                <p className="mb-0.5 text-xs font-semibold text-muted">
                  {r.user.name}{r.isTeacher && " · müəllim"} · <time dateTime={r.createdAt}>{ago(r.createdAt)}</time>
                </p>
                <p className="whitespace-pre-wrap break-words">{r.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={send} className="space-y-2">
        <Textarea
          aria-label={`“${q.title}” sualına cavab`}
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Cavabınızı yazın…"
          maxLength={5000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={sending} disabled={!reply.trim()}><Send className="h-4 w-4" aria-hidden /> Cavabla</Button>
          <span className="hidden text-xs text-muted sm:inline">Ctrl/⌘ + Enter</span>
          <div className="ml-auto flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" loading={busy === "pin"} onClick={() => void patch({ pinned: !q.pinned }, "pin")}>
              {q.pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />} {q.pinned ? "Sancağı çıxar" : "Sancaqla"}
            </Button>
            {q.status === "CLOSED" ? (
              <Button variant="ghost" size="sm" loading={busy === "status"} onClick={() => void patch({ status: q.replies.some((r) => r.isTeacher) ? "ANSWERED" : "OPEN" }, "status")}>
                <Unlock className="h-4 w-4" aria-hidden /> Yenidən aç
              </Button>
            ) : (
              <Button variant="ghost" size="sm" loading={busy === "status"} onClick={() => void patch({ status: "CLOSED" }, "status")}>
                <Lock className="h-4 w-4" aria-hidden /> Bağla
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default function AdminQuestionsClient({ questions: init }: { questions: QuestionItem[] }) {
  const [questions, setQuestions] = useState(init);
  const [filter, setFilter] = useState<Status | "all">("OPEN");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      OPEN: questions.filter((q) => q.status === "OPEN").length,
      ANSWERED: questions.filter((q) => q.status === "ANSWERED").length,
      CLOSED: questions.filter((q) => q.status === "CLOSED").length,
    }),
    [questions]
  );

  const list = useMemo(() => {
    const s = query.trim().toLocaleLowerCase("az");
    return questions
      .filter((q) => filter === "all" || q.status === filter)
      .filter((q) => !s || `${q.title} ${q.body} ${q.user.name} ${q.lessonTitle ?? ""}`.toLocaleLowerCase("az").includes(s))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  }, [questions, filter, query]);

  const update = (q: QuestionItem) => setQuestions((prev) => prev.map((x) => (x.id === q.id ? q : x)));

  return (
    <div>
      <PageHeader title="Suallar" description="Tələbə suallarını cavablandırın, vacib olanları sancaqlayın." />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <Tabs
          label="Status"
          value={filter}
          onValueChange={(v) => setFilter(v as Status | "all")}
          items={[
            { value: "OPEN", label: "Açıq", count: counts.OPEN },
            { value: "ANSWERED", label: "Cavablandı", count: counts.ANSWERED },
            { value: "CLOSED", label: "Bağlı", count: counts.CLOSED },
            { value: "all", label: "Hamısı" },
          ]}
        />
        <div className="relative min-w-0 md:ml-auto md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" aria-label="Suallarda axtar" placeholder="Axtar…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title={filter === "OPEN" && !query ? "Açıq sual yoxdur" : "Sual tapılmadı"}
          description={filter === "OPEN" && !query ? "Bütün suallar cavablandırılıb." : "Filtri və ya axtarışı dəyişin."}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((q) => {
            const expanded = open === q.id;
            const st = STATUS[q.status];
            return (
              <li key={q.id} className={cn("rounded-xl border bg-surface", q.status === "OPEN" ? "border-flame/30" : "border-line")}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : q.id)}
                  aria-expanded={expanded}
                  aria-controls={`q-${q.id}`}
                  className="flex w-full items-start gap-3 rounded-xl p-4 text-left hover:bg-surface-2/50"
                >
                  <Avatar name={q.user.name} src={q.user.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      {q.pinned && <Pin className="mt-1 h-3.5 w-3.5 shrink-0 text-iris" aria-label="Sancaqlanıb" />}
                      <span className="break-words font-semibold text-ink">{q.title}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      <span>{q.user.name}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={q.createdAt}>{ago(q.createdAt)}</time>
                      {q.lessonTitle && (
                        <span className="inline-flex min-w-0 items-center gap-1"><BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{q.lessonTitle}</span></span>
                      )}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden /> {q.replies.length}<span className="sr-only"> cavab</span>
                      <ChevronDown aria-hidden className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                    </span>
                  </span>
                </button>
                <div id={`q-${q.id}`} hidden={!expanded} className="border-t border-line p-4">
                  {expanded && <Thread q={q} onChange={update} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

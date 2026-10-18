"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { BookOpen, ChevronDown, GraduationCap, MessageCircle, Pin, Plus, RotateCcw, Search, Send, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { FeedPage, QuestionFilter, QuestionView, ReplyView } from "@/app/api/questions/query";
import { formatAzDateTime } from "../calendar/az-date";

const FILTERS: { value: QuestionFilter; label: string }[] = [
  { value: "all", label: "Hamısı" },
  { value: "mine", label: "Mənim" },
  { value: "answered", label: "Cavablanmış" },
  { value: "open", label: "Açıq" },
];

const NO_LESSON = "__none";

function errorMessage(data: unknown, fallback: string) {
  return data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : fallback;
}

export default function QuestionsClient({ initial, lessons }: { initial: FeedPage; lessons: SelectOption[] }) {
  const [items, setItems] = useState<QuestionView[]>(initial.items);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [filter, setFilter] = useState<QuestionFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const firstRun = useRef(true);

  const load = useCallback(async (f: QuestionFilter, q: string, skip: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const params = new URLSearchParams({ filter: f, skip: String(skip) });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/questions?${params}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error();
    return (await res.json()) as FeedPage;
  }, []);

  const reload = useCallback(async (f: QuestionFilter, q: string) => {
    setLoading(true);
    setError(false);
    try {
      const page = await load(f, q, 0);
      setItems(page.items);
      setHasMore(page.hasMore);
      setLoading(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(true);
      setLoading(false);
    }
  }, [load]);

  // Refetch on filter change immediately, on search after a short pause.
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => void reload(filter, search), 300);
    return () => clearTimeout(t);
  }, [filter, search, reload]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await load(filter, search, items.length);
      setItems((prev) => {
        const seen = new Set(prev.map((q) => q.id));
        return [...prev, ...page.items.filter((q) => !seen.has(q.id))];
      });
      setHasMore(page.hasMore);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  function onAsked() {
    setAskOpen(false);
    if (filter === "all" && !search) void reload("all", "");
    else { setFilter("all"); setSearch(""); }
  }

  return (
    <div className="grid gap-5">
      {askOpen ? (
        <AskForm lessons={lessons} onCancel={() => setAskOpen(false)} onDone={onAsked} />
      ) : (
        <Button onClick={() => setAskOpen(true)} className="justify-self-start">
          <Plus className="h-4 w-4" aria-hidden /> Sual ver
        </Button>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs label="Sual filtri" value={filter} onValueChange={(v) => setFilter(v as QuestionFilter)} items={FILTERS} />
        <div className="relative md:w-72">
          <label htmlFor="q-search" className="sr-only">Suallarda axtar</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input id="q-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Axtar…" className="pl-10" />
        </div>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
            <span className="sr-only">Yüklənir…</span>
          </div>
        ) : error && items.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" aria-hidden />}
            title="Suallar yüklənmədi"
            description="İnterneti yoxla və yenidən cəhd et."
            action={<Button variant="secondary" size="sm" onClick={() => void reload(filter, search)}><RotateCcw className="h-4 w-4" aria-hidden /> Yenidən</Button>}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" aria-hidden />}
            title={search ? "Heç nə tapılmadı" : filter === "mine" ? "Hələ sual verməmisən" : "Hələ sual yoxdur"}
            description={search ? "Başqa söz yoxla." : "İlk sualı sən ver — müəllim cavablandıracaq."}
          />
        ) : (
          <ul className="grid gap-3">
            {items.map((q) => (
              <li key={q.id}>
                <QuestionCard
                  question={q}
                  onReplied={(r) => setItems((prev) => prev.map((x) => (x.id === q.id ? { ...x, replies: [...x.replies, r], status: r.isTeacher ? "ANSWERED" : x.status } : x)))}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && hasMore && (
        <Button variant="secondary" onClick={loadMore} loading={loadingMore} className="justify-self-center">
          Daha çox
        </Button>
      )}
      {!loading && error && items.length > 0 && <p role="alert" className="text-center text-sm text-bug">Yüklənmədi. Yenidən cəhd et.</p>}
    </div>
  );
}

function AskForm({ lessons, onCancel, onDone }: { lessons: SelectOption[]; onCancel: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [lessonId, setLessonId] = useState(NO_LESSON);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const id = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) { setError("Başlıq ən azı 3 simvol olmalıdır"); return; }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, lessonId: lessonId === NO_LESSON ? null : lessonId }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(errorMessage(data, "Göndərilmədi"));
      toast({ variant: "success", title: "Sual göndərildi" });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Göndərilmədi");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-ink">Yeni sual</h2>
          <Button variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Bağla"><X className="h-4 w-4" aria-hidden /></Button>
        </div>
        <div>
          <Label htmlFor={`${id}-title`}>Başlıq</Label>
          <Input
            id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required autoFocus
            placeholder="Məs.: Smoke və sanity test fərqi nədir?"
            aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined}
          />
        </div>
        <div>
          <Label htmlFor={`${id}-body`}>Ətraflı <span className="font-normal text-muted">(istəyə görə)</span></Label>
          <Textarea id={`${id}-body`} rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} placeholder="Nəyi başa düşmədin?" />
        </div>
        {lessons.length > 0 && (
          <div>
            <Label htmlFor={`${id}-lesson`}>Dərs <span className="font-normal text-muted">(istəyə görə)</span></Label>
            <Select id={`${id}-lesson`} value={lessonId} onValueChange={setLessonId} options={[{ value: NO_LESSON, label: "Ümumi sual" }, ...lessons]} />
          </div>
        )}
        {error && <p id={`${id}-err`} role="alert" className="text-sm text-bug">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={pending}>Ləğv et</Button>
          <Button type="submit" loading={pending} disabled={!title.trim()}>
            {!pending && <Send className="h-4 w-4" aria-hidden />} Göndər
          </Button>
        </div>
      </form>
    </Card>
  );
}

function QuestionCard({ question: q, onReplied }: { question: QuestionView; onReplied: (r: ReplyView) => void }) {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadId = useId();
  const answered = q.status === "ANSWERED";
  const teacherReplies = q.replies.filter((r) => r.isTeacher).length;

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(q.id)}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(errorMessage(data, "Göndərilmədi"));
      const r = data as ReplyView;
      onReplied({ ...r, createdAt: new Date(r.createdAt).toISOString() });
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Göndərilmədi");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card padding="none" className={cn(q.pinned && "border-iris/40")}>
      <div className="flex gap-3 p-4 sm:p-5">
        <Avatar name={q.user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {q.pinned && <Badge tone="iris"><Pin className="h-3 w-3" aria-hidden /> Sabitlənib</Badge>}
            <Badge tone={answered ? "pass" : "neutral"}>{answered ? "Cavablanıb" : "Açıq"}</Badge>
            {q.isMine && <Badge tone="sky">Sənin</Badge>}
          </div>
          <h2 className="mt-1.5 break-words font-semibold text-ink">{q.title}</h2>
          <p className="text-xs text-muted">
            {q.user.name}{q.user.isTeacher && " · Müəllim"} · <time dateTime={q.createdAt}>{formatAzDateTime(q.createdAt)}</time>
          </p>
          {q.lesson && (
            <Link href={`/learn/${q.lesson.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-iris hover:underline">
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> {q.lesson.title}
            </Link>
          )}
          {q.body && <p className="mt-2 whitespace-pre-line break-words text-sm text-ink-2">{q.body}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={threadId}
        className="flex w-full items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm font-medium text-ink-2 hover:bg-surface-2 sm:px-5"
      >
        <span className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" aria-hidden />
          {q.replies.length ? `${q.replies.length} cavab` : "Cavab yaz"}
          {teacherReplies > 0 && <Badge tone="iris"><GraduationCap className="h-3 w-3" aria-hidden /> Müəllim cavabı</Badge>}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div id={threadId} className="grid gap-3 border-t border-line bg-surface-2/40 p-4 sm:p-5">
          {q.replies.length > 0 && (
            <ul className="grid gap-2">
              {q.replies.map((r) => (
                <li
                  key={r.id}
                  className={cn("rounded-lg border p-3 text-sm", r.isTeacher ? "border-iris/30 bg-iris-soft" : "border-line bg-surface")}
                >
                  <p className="mb-1 flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="font-semibold text-ink">{r.user.name}</span>
                    {r.isTeacher && <Badge tone="iris"><GraduationCap className="h-3 w-3" aria-hidden /> Müəllim</Badge>}
                    <time dateTime={r.createdAt} className="text-muted">{formatAzDateTime(r.createdAt)}</time>
                  </p>
                  <p className="whitespace-pre-line break-words text-ink-2">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={send} className="grid gap-2">
            <label htmlFor={`${threadId}-reply`} className="sr-only">Cavabın</label>
            <Textarea
              id={`${threadId}-reply`} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000}
              placeholder="Cavab yaz…" aria-invalid={error ? true : undefined} aria-describedby={error ? `${threadId}-err` : undefined}
            />
            {error && <p id={`${threadId}-err`} role="alert" className="text-sm text-bug">{error}</p>}
            <Button type="submit" size="sm" loading={pending} disabled={!reply.trim()} className="justify-self-end">
              {!pending && <Send className="h-4 w-4" aria-hidden />} Göndər
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

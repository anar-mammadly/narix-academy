"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, MessageSquareText, Pencil, Send, Star } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { dayKey, daysBetween, formatAzDate, formatAzDateTime } from "../calendar/az-date";

export type HomeworkSubmitView = {
  content: string;
  status: string; // SUBMITTED | GRADED | RETURNED
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
};

export type HomeworkItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  lesson: { title: string; slug: string; moduleTitle: string };
  submit: HomeworkSubmitView | null;
};

type Group = "pending" | "submitted" | "graded";

function groupOf(h: HomeworkItem): Group {
  if (!h.submit || h.submit.status === "RETURNED") return "pending";
  return h.submit.status === "GRADED" ? "graded" : "submitted";
}

const GROUP_LABEL: Record<Group, string> = { pending: "Gözləyir", submitted: "Göndərildi", graded: "Qiymətləndirildi" };

export default function HomeworkClient({ initial, now }: { initial: HomeworkItem[]; now: string }) {
  const [items, setItems] = useState(initial);
  const grouped = useMemo(() => {
    const g: Record<Group, HomeworkItem[]> = { pending: [], submitted: [], graded: [] };
    for (const h of items) g[groupOf(h)].push(h);
    return g;
  }, [items]);
  const [tab, setTab] = useState<Group>(() =>
    grouped.pending.length ? "pending" : grouped.submitted.length ? "submitted" : grouped.graded.length ? "graded" : "pending"
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-6 w-6" aria-hidden />}
        title="Hələ tapşırıq yoxdur"
        description="Müəllim tapşırıq verəndə burada görünəcək."
      />
    );
  }

  function onSaved(id: string, submit: HomeworkSubmitView) {
    setItems((prev) => prev.map((h) => (h.id === id ? { ...h, submit } : h)));
  }

  const list = grouped[tab];

  return (
    <div className="grid gap-5">
      <Tabs
        label="Tapşırıq statusu"
        value={tab}
        onValueChange={(v) => setTab(v as Group)}
        items={(Object.keys(GROUP_LABEL) as Group[]).map((g) => ({ value: g, label: GROUP_LABEL[g], count: grouped[g].length }))}
        className="w-full sm:w-auto"
      />

      <div role="tabpanel" aria-label={GROUP_LABEL[tab]}>
        {list.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" aria-hidden />}
            title={tab === "pending" ? "Gözləyən tapşırıq yoxdur" : tab === "submitted" ? "Yoxlanılan cavab yoxdur" : "Hələ qiymət yoxdur"}
            description={tab === "pending" ? "Hamısını göndərmisən. Əla!" : undefined}
          />
        ) : (
          <ul className="grid gap-4">
            {list.map((h) => (
              <li key={h.id}>
                <HomeworkCard item={h} now={now} onSaved={onSaved} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DueChip({ dueDate, done, now }: { dueDate: string | null; done: boolean; now: string }) {
  if (!dueDate) return null;
  const date = formatAzDate(dueDate, false);
  let tone: BadgeTone = "neutral";
  let text = `Son tarix: ${date}`;
  let icon = <CalendarClock className="h-3.5 w-3.5" aria-hidden />;
  if (!done) {
    const left = daysBetween(dayKey(now), dayKey(dueDate));
    if (new Date(dueDate).getTime() < new Date(now).getTime()) {
      tone = "bug";
      text = `Gecikib · ${date}`;
      icon = <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
    } else if (left === 0) {
      tone = "xp";
      text = "Bu gün son gündür";
    } else if (left === 1) {
      tone = "xp";
      text = "Sabah son gündür";
    } else if (left <= 3) {
      tone = "xp";
      text = `${left} gün qalıb`;
    }
  }
  return (
    <Badge tone={tone} title={formatAzDateTime(dueDate)}>
      {icon}
      {text}
    </Badge>
  );
}

function HomeworkCard({ item, now, onSaved }: { item: HomeworkItem; now: string; onSaved: (id: string, s: HomeworkSubmitView) => void }) {
  const group = groupOf(item);
  const s = item.submit;
  const [editing, setEditing] = useState(group === "pending");
  const [text, setText] = useState(s?.content ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const fieldId = useId();

  async function save() {
    if (!text.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/homework/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeworkId: item.id, content: text }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "Göndərilmədi";
        throw new Error(msg);
      }
      const sub = data as HomeworkSubmitView & { submittedAt: string };
      onSaved(item.id, { ...sub, submittedAt: new Date(sub.submittedAt).toISOString() });
      setEditing(false);
      toast({ variant: "success", title: s ? "Cavab yeniləndi" : "Cavab göndərildi" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Göndərilmədi. İnterneti yoxla.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card padding="none" className={cn("overflow-hidden", group === "graded" && "border-pass/30")}>
      <div className="grid gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={group === "graded" ? "pass" : group === "submitted" ? "sky" : "neutral"}>
            {group === "graded" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : group === "submitted" ? <Send className="h-3.5 w-3.5" aria-hidden /> : <ClipboardList className="h-3.5 w-3.5" aria-hidden />}
            {s?.status === "RETURNED" ? "Geri qaytarıldı" : GROUP_LABEL[group]}
          </Badge>
          <DueChip dueDate={item.dueDate} done={group !== "pending"} now={now} />
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{item.title}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {item.lesson.moduleTitle && <>{item.lesson.moduleTitle} · </>}
            <Link href={`/learn/${item.lesson.slug}`} className="inline-flex items-center gap-1 font-medium text-iris hover:underline">
              {item.lesson.title} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>
        </div>

        {item.description && <p className="whitespace-pre-line break-words text-ink-2">{item.description}</p>}
      </div>

      {s?.feedback || s?.grade != null ? (
        <div className="grid gap-2 border-t border-line bg-pass-soft/50 p-4 sm:p-5">
          {s.grade != null && (
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Star className="h-4 w-4 fill-xp-bright text-xp-bright" aria-hidden />
              Qiymət: <span className="font-display text-xl text-pass">{s.grade}</span>
              <span className="text-sm font-normal text-muted">/ 100</span>
            </p>
          )}
          {s.feedback && (
            <div className="flex gap-2 text-sm">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-iris" aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold text-ink">Müəllimin rəyi</p>
                <p className="whitespace-pre-line break-words text-ink-2">{s.feedback}</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="border-t border-line bg-surface-2/40 p-4 sm:p-5">
        {editing ? (
          <div className="grid gap-2">
            <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">Sənin cavabın</label>
            <Textarea
              id={fieldId}
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cavabını buraya yaz…"
              maxLength={20000}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${fieldId}-err` : undefined}
            />
            {error && <p id={`${fieldId}-err`} role="alert" className="text-sm text-bug">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              {s && s.status !== "RETURNED" && (
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setText(s.content); setError(null); }} disabled={pending}>
                  Ləğv et
                </Button>
              )}
              <Button size="sm" onClick={save} loading={pending} disabled={!text.trim()}>
                {!pending && <Send className="h-4 w-4" aria-hidden />}
                {s ? "Yenilə" : "Göndər"}
              </Button>
            </div>
          </div>
        ) : s ? (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink-2">
                Sənin cavabın <span className="font-normal text-muted">· {formatAzDateTime(s.submittedAt)}</span>
              </p>
              {group === "submitted" && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" aria-hidden /> Düzəliş et
                </Button>
              )}
            </div>
            <p className="whitespace-pre-line break-words rounded-lg bg-surface p-3 text-sm text-ink-2">{s.content}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

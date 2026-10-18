"use client";

import { useId, useMemo, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { az } from "date-fns/locale";
import { CalendarClock, Check, ChevronDown, ClipboardList, FileText, Inbox, Paperclip, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { errorMessage, requestJson } from "@/components/admin/request";
import { cn } from "@/lib/utils";

export type Submit = {
  id: string;
  content: string;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  status: string;
  submittedAt: string;
  user: { name: string; avatarUrl: string | null };
};
export type HomeworkItem = { id: string; title: string; description: string; dueDate: string | null; lessonTitle: string; submits: Submit[] };

const isPending = (s: Submit) => s.grade === null;
const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: az });
const fmt = (iso: string) => format(new Date(iso), "d MMM yyyy, HH:mm", { locale: az });

function GradeForm({ submit, onGraded }: { submit: Submit; onGraded: (s: Submit) => void }) {
  const toast = useToast();
  const id = useId();
  const [grade, setGrade] = useState(submit.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submit.feedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(grade);
    if (grade.trim() === "" || !Number.isInteger(n) || n < 0 || n > 100) {
      setError("0–100 arası tam ədəd daxil edin");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestJson("/api/homework/grade", "POST", { submitId: submit.id, grade: n, feedback: feedback.trim() });
      onGraded({ ...submit, grade: n, feedback: feedback.trim() || null, status: "GRADED" });
      toast({ title: "Qiymət yazıldı", description: `${submit.user.name}: ${n}/100`, variant: "success" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="grid gap-3 sm:grid-cols-[7rem_1fr_auto] sm:items-end">
      <div>
        <Label htmlFor={`${id}-g`}>Qiymət (/100)</Label>
        <Input
          id={`${id}-g`}
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : undefined}
          placeholder="85"
        />
      </div>
      <div>
        <Label htmlFor={`${id}-f`}>Rəy</Label>
        <Textarea id={`${id}-f`} rows={1} className="min-h-11" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Güclü tərəflər və nəyi yaxşılaşdırmaq olar…" />
      </div>
      <Button type="submit" loading={saving}><Check className="h-4 w-4" aria-hidden /> {submit.grade === null ? "Qiymətləndir" : "Yenilə"}</Button>
      {error && <p id={`${id}-e`} role="alert" className="text-sm text-bug sm:col-span-3">{error}</p>}
    </form>
  );
}

function SubmitCard({ submit, homeworkTitle, onGraded }: { submit: Submit; homeworkTitle?: string; onGraded: (s: Submit) => void }) {
  const [editing, setEditing] = useState(false);
  const pending = isPending(submit);
  return (
    <article className={cn("rounded-xl border bg-surface p-4", pending ? "border-xp/40" : "border-line")}>
      <header className="flex flex-wrap items-center gap-3">
        <Avatar name={submit.user.name} src={submit.user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{submit.user.name}</p>
          <p className="text-xs text-muted">
            {homeworkTitle && <>{homeworkTitle} · </>}
            <time dateTime={submit.submittedAt} title={fmt(submit.submittedAt)}>{ago(submit.submittedAt)}</time>
          </p>
        </div>
        {pending ? <Badge tone="xp">Yoxlanılmayıb</Badge> : <Badge tone="pass">{submit.grade}/100</Badge>}
      </header>
      <div className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-sm text-ink-2">{submit.content || "—"}</div>
      {submit.fileUrl && (
        <a href={submit.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-iris hover:underline">
          <Paperclip className="h-4 w-4" aria-hidden /> Əlavə fayl
        </a>
      )}
      {!pending && submit.feedback && !editing && <p className="mt-3 text-sm text-ink-2"><span className="font-semibold text-ink">Rəy:</span> {submit.feedback}</p>}
      <div className="mt-3">
        {pending || editing ? (
          <GradeForm submit={submit} onGraded={(s) => { setEditing(false); onGraded(s); }} />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Qiyməti dəyiş</Button>
        )}
      </div>
    </article>
  );
}

export default function AdminHomeworkClient({ homeworks: init, lessons }: { homeworks: HomeworkItem[]; lessons: { id: string; title: string }[] }) {
  const toast = useToast();
  const [homeworks, setHomeworks] = useState(init);
  const [tab, setTab] = useState<"queue" | "all">("queue");
  const [open, setOpen] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ lessonId: "", title: "", description: "", dueDate: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const lessonFieldId = useId();

  const queue = useMemo(
    () =>
      homeworks
        .flatMap((h) => h.submits.filter(isPending).map((s) => ({ s, h })))
        .sort((a, b) => a.s.submittedAt.localeCompare(b.s.submittedAt)),
    [homeworks]
  );

  function updateSubmit(homeworkId: string, s: Submit) {
    setHomeworks((prev) => prev.map((h) => (h.id === homeworkId ? { ...h, submits: h.submits.map((x) => (x.id === s.id ? s : x)) } : h)));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lessonId) return setCreateError("Dərs seçin");
    if (!form.title.trim()) return setCreateError("Başlıq tələb olunur");
    setCreating(true);
    setCreateError(null);
    try {
      const hw = await requestJson<{ id: string; title: string; description: string; dueDate: string | null; lesson: { title: string } }>("/api/homework", "POST", {
        lessonId: form.lessonId,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      setHomeworks((prev) => [{ id: hw.id, title: hw.title, description: hw.description, dueDate: hw.dueDate, lessonTitle: hw.lesson.title, submits: [] }, ...prev]);
      setForm({ lessonId: "", title: "", description: "", dueDate: "" });
      setCreateOpen(false);
      setTab("all");
      toast({ title: "Tapşırıq yaradıldı", variant: "success" });
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tapşırıqlar"
        description="Ev tapşırıqlarını yaradın və tələbə cavablarını qiymətləndirin."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Tapşırıq yarat</Button>}
      />

      <Tabs
        className="mb-5"
        label="Görünüş"
        value={tab}
        onValueChange={(v) => setTab(v as "queue" | "all")}
        items={[
          { value: "queue", label: "Yoxlanılacaq", count: queue.length },
          { value: "all", label: "Bütün tapşırıqlar", count: homeworks.length },
        ]}
      />

      {tab === "queue" ? (
        queue.length === 0 ? (
          <EmptyState icon={<Inbox className="h-6 w-6" />} title="Yoxlanılacaq cavab yoxdur" description="Yeni cavablar gəldikdə burada, ən köhnəsi əvvəldə görünəcək." />
        ) : (
          <div className="space-y-3">
            {queue.map(({ s, h }) => <SubmitCard key={s.id} submit={s} homeworkTitle={h.title} onGraded={(x) => updateSubmit(h.id, x)} />)}
          </div>
        )
      ) : homeworks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Hələ tapşırıq yoxdur"
          description="Dərsə bağlı ilk ev tapşırığını yaradın."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Tapşırıq yarat</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {homeworks.map((h) => {
            const pending = h.submits.filter(isPending).length;
            const graded = h.submits.length - pending;
            const expanded = open === h.id;
            const overdue = h.dueDate && new Date(h.dueDate) < new Date();
            return (
              <li key={h.id} className="rounded-xl border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : h.id)}
                  aria-expanded={expanded}
                  aria-controls={`hw-${h.id}`}
                  className="flex w-full items-start gap-3 rounded-xl p-4 text-left hover:bg-surface-2/50"
                >
                  <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky"><FileText className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{h.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{h.lessonTitle}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      {pending > 0 && <Badge tone="xp">{pending} gözləyir</Badge>}
                      <Badge tone="pass">{graded} qiymətləndirilib</Badge>
                      {h.dueDate && (
                        <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "text-bug" : "text-muted")}>
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {fmt(h.dueDate)}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown aria-hidden className={cn("mt-1 h-4 w-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
                </button>
                <div id={`hw-${h.id}`} hidden={!expanded} className="border-t border-line p-4">
                  {expanded && (
                    <div className="space-y-3">
                      {h.description && <p className="whitespace-pre-wrap text-sm text-ink-2">{h.description}</p>}
                      {h.submits.length === 0 ? (
                        <p className="rounded-lg bg-surface-2 p-4 text-center text-sm text-muted">Hələ cavab yoxdur</p>
                      ) : (
                        h.submits.map((s) => <SubmitCard key={s.id} submit={s} onGraded={(x) => updateSubmit(h.id, x)} />)
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={createOpen} onOpenChange={(o) => !creating && setCreateOpen(o)} title="Yeni tapşırıq">
        <form onSubmit={create} noValidate className="space-y-4">
          <div>
            <Label htmlFor={lessonFieldId}>Dərs *</Label>
            <Select id={lessonFieldId} value={form.lessonId} onValueChange={(lessonId) => setForm({ ...form, lessonId })} options={lessons.map((l) => ({ value: l.id, label: l.title }))} placeholder="Dərs seçin" />
          </div>
          <Field label="Başlıq *">
            {(p) => <Input {...p} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />}
          </Field>
          <Field label="Şərt">
            {(p) => <Textarea {...p} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tələbə nə etməlidir, nəticəni necə təqdim etməlidir…" />}
          </Field>
          <Field label="Son tarix (istəyə bağlı)">
            {(p) => <Input {...p} type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />}
          </Field>
          {createError && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{createError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>Ləğv et</Button>
            <Button type="submit" loading={creating}>Yarat</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

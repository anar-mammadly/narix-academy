"use client";

import { useId, useMemo, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { az } from "date-fns/locale";
import { AlarmClock, BookOpen, CalendarDays, CalendarPlus, GraduationCap, Shapes, Trash2, Video } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { errorMessage, requestJson } from "@/components/admin/request";
import { cn } from "@/lib/utils";

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  type: string;
  meetLink: string | null;
  createdBy: string;
};

const TYPES: Record<string, { label: string; tone: BadgeTone; icon: typeof BookOpen }> = {
  CLASS: { label: "Dərs", tone: "iris", icon: BookOpen },
  EXAM: { label: "İmtahan", tone: "bug", icon: GraduationCap },
  DEADLINE: { label: "Son tarix", tone: "xp", icon: AlarmClock },
  OTHER: { label: "Digər", tone: "neutral", icon: Shapes },
};

const tile: Record<BadgeTone, string> = {
  iris: "bg-iris-soft text-iris-ink", bug: "bg-bug-soft text-bug", xp: "bg-xp-soft text-xp", neutral: "bg-surface-2 text-ink-2",
  pass: "bg-pass-soft text-pass", sky: "bg-sky-soft text-sky", flame: "bg-flame-soft text-flame",
};

function dayLabel(d: Date) {
  if (isToday(d)) return "Bu gün";
  if (isTomorrow(d)) return "Sabah";
  return format(d, "d MMMM, EEEE", { locale: az });
}

function EventRow({ e, muted, onDelete }: { e: EventItem; muted?: boolean; onDelete: (e: EventItem) => void }) {
  const t = TYPES[e.type] ?? TYPES.OTHER;
  const Icon = t.icon;
  const start = new Date(e.startAt);
  return (
    <li className={cn("flex items-start gap-3 rounded-xl border border-line bg-surface p-3 sm:p-4", muted && "opacity-75")}>
      <span aria-hidden className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", tile[t.tone])}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words font-semibold text-ink">{e.title}</span>
          <Badge tone={t.tone}>{t.label}</Badge>
        </div>
        <p className="mt-0.5 text-sm text-ink-2">
          <time dateTime={e.startAt}>{muted ? format(start, "d MMM, HH:mm", { locale: az }) : format(start, "HH:mm")}</time>
          {e.endAt && <> – <time dateTime={e.endAt}>{format(new Date(e.endAt), "HH:mm")}</time></>}
        </p>
        {e.description && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{e.description}</p>}
        {e.meetLink && (
          <a href={e.meetLink} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-iris hover:underline">
            <Video className="h-4 w-4" aria-hidden /> Görüşə qoşul<span className="sr-only"> (yeni pəncərə)</span>
          </a>
        )}
      </div>
      <Button variant="danger-ghost" size="icon-sm" aria-label={`“${e.title}” tədbirini sil`} onClick={() => onDelete(e)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

const emptyForm = { title: "", description: "", startAt: "", endAt: "", type: "CLASS", meetLink: "" };

export default function AdminCalendarClient({ events: init }: { events: EventItem[] }) {
  const toast = useToast();
  const [events, setEvents] = useState(init);
  const [now] = useState(() => Date.now());
  const [showPast, setShowPast] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typeId = useId();

  const [toDelete, setToDelete] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
    // An event stays "upcoming" until it ends (or 2h after start when no end is set).
    const isPast = (e: EventItem) => (e.endAt ? new Date(e.endAt).getTime() : new Date(e.startAt).getTime() + 2 * 3600_000) < now;
    return { upcoming: sorted.filter((e) => !isPast(e)), past: sorted.filter(isPast).reverse() };
  }, [events, now]);

  const groups = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of upcoming) {
      const k = format(new Date(e.startAt), "yyyy-MM-dd");
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()];
  }, [upcoming]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Başlıq tələb olunur");
    if (!form.startAt) return setError("Başlama vaxtını seçin");
    if (form.endAt && new Date(form.endAt) <= new Date(form.startAt)) return setError("Bitmə vaxtı başlamadan sonra olmalıdır");
    setSaving(true);
    setError(null);
    try {
      const ev = await requestJson<{ id: string; title: string; description: string | null; startAt: string; endAt: string | null; type: string; meetLink: string | null; createdBy: { name: string } }>(
        "/api/calendar",
        "POST",
        {
          title: form.title.trim(),
          description: form.description.trim(),
          // datetime-local is local time; send an absolute ISO instant.
          startAt: new Date(form.startAt).toISOString(),
          endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
          type: form.type,
          meetLink: form.meetLink.trim(),
        }
      );
      setEvents((prev) => [...prev, { ...ev, createdBy: ev.createdBy.name }]);
      setForm(emptyForm);
      setOpen(false);
      toast({ title: "Tədbir əlavə edildi", variant: "success" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await requestJson(`/api/calendar/${toDelete.id}`, "DELETE");
      setEvents((prev) => prev.filter((x) => x.id !== toDelete.id));
      setToDelete(null);
      toast({ title: "Tədbir silindi", variant: "success" });
    } catch (err) {
      toast({ title: "Silinmədi", description: errorMessage(err), variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Təqvim"
        description="Dərslər, imtahanlar və son tarixlər tələbələrin təqvimində görünür."
        actions={<Button onClick={() => setOpen(true)}><CalendarPlus className="h-4 w-4" aria-hidden /> Tədbir əlavə et</Button>}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Qarşıda tədbir yoxdur"
          description="Növbəti dərsi və ya son tarixi əlavə edin."
          action={<Button onClick={() => setOpen(true)}><CalendarPlus className="h-4 w-4" aria-hidden /> Tədbir əlavə et</Button>}
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([key, list]) => (
            <section key={key} aria-labelledby={`d-${key}`}>
              <h2 id={`d-${key}`} className="mb-2 text-sm font-semibold capitalize text-ink-2">{dayLabel(new Date(list[0].startAt))}</h2>
              <ul className="space-y-2">{list.map((e) => <EventRow key={e.id} e={e} onDelete={setToDelete} />)}</ul>
            </section>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-8">
          <Button variant="ghost" size="sm" aria-expanded={showPast} onClick={() => setShowPast((s) => !s)}>
            {showPast ? "Keçmiş tədbirləri gizlət" : `Keçmiş tədbirlər (${past.length})`}
          </Button>
          {showPast && <ul className="mt-3 space-y-2">{past.map((e) => <EventRow key={e.id} e={e} muted onDelete={setToDelete} />)}</ul>}
        </section>
      )}

      <Modal open={open} onOpenChange={(o) => !saving && setOpen(o)} title="Yeni tədbir">
        <form onSubmit={create} noValidate className="space-y-4">
          <Field label="Başlıq *">
            {(p) => <Input {...p} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Məs.: API testinə giriş" maxLength={200} />}
          </Field>
          <div>
            <Label htmlFor={typeId}>Növ</Label>
            <Select id={typeId} value={form.type} onValueChange={(type) => setForm({ ...form, type })} options={Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Başlama *">
              {(p) => <Input {...p} type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />}
            </Field>
            <Field label="Bitmə">
              {(p) => <Input {...p} type="datetime-local" value={form.endAt} min={form.startAt || undefined} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />}
            </Field>
          </div>
          <Field label="Görüş linki" hint="Google Meet, Zoom və s.">
            {(p) => <Input {...p} type="url" inputMode="url" value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })} placeholder="https://meet.google.com/…" />}
          </Field>
          <Field label="Qeyd">
            {(p) => <Textarea {...p} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          {error && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Ləğv et</Button>
            <Button type="submit" loading={saving}>Əlavə et</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Tədbir silinsin?" confirmLabel="Sil" loading={deleting} onConfirm={() => void remove()}>
        “{toDelete?.title}” tələbələrin təqvimindən də silinəcək.
      </ConfirmModal>
    </div>
  );
}

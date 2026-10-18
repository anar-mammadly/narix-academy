"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ExternalLink, Eye, EyeOff, Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { BackLink } from "@/components/admin/BackLink";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { ModuleFields, moduleBody, type ModuleDraft } from "@/components/admin/ModuleForm";
import { SortableList } from "@/components/admin/SortableList";
import { errorMessage, requestJson } from "@/components/admin/request";
import { cn } from "@/lib/utils";

type ModuleData = ModuleDraft & { id: string };
type LessonRow = { id: string; title: string; published: boolean; minutes: number; blocks: number; learners: number };

const same = (a: ModuleDraft, b: ModuleDraft) => (Object.keys(a) as (keyof ModuleDraft)[]).every((k) => a[k] === b[k]);

export default function ModuleEditClient({ module: mod, lessons: initialLessons, openNewLesson }: { module: ModuleData; lessons: LessonRow[]; openNewLesson: boolean }) {
  const router = useRouter();
  const toast = useToast();

  const [saved, setSaved] = useState<ModuleDraft>(mod);
  const [form, setForm] = useState<ModuleDraft>(mod);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string>();
  const dirty = !same(form, saved);

  const [lessons, setLessons] = useState(initialLessons);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);

  const [confirmModule, setConfirmModule] = useState(false);
  const [deletingModule, setDeletingModule] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<LessonRow | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);

  const [newOpen, setNewOpen] = useState(openNewLesson);
  const [newLesson, setNewLesson] = useState({ title: "", shortDescription: "", minutes: "30" });
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  async function saveModule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError("Başlıq tələb olunur");
      return;
    }
    setSaving(true);
    try {
      await requestJson(`/api/modules/${mod.id}`, "PATCH", moduleBody(form));
      setSaved(form);
      toast({ title: "Modul saxlanıldı", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "Saxlanmadı", description: errorMessage(err), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteModule() {
    setDeletingModule(true);
    try {
      await requestJson(`/api/modules/${mod.id}`, "DELETE");
      toast({ title: "Modul silindi", variant: "success" });
      router.push("/admin/modules");
      router.refresh();
    } catch (err) {
      toast({ title: "Silinmədi", description: errorMessage(err), variant: "error" });
      setDeletingModule(false);
    }
  }

  async function togglePublish(l: LessonRow) {
    setBusyLesson(l.id);
    try {
      await requestJson(`/api/lessons/${l.id}`, "PATCH", { published: !l.published });
      setLessons((prev) => prev.map((x) => (x.id === l.id ? { ...x, published: !l.published } : x)));
      toast({ title: l.published ? "Dərs qaralamaya qaytarıldı" : "Dərs yayımlandı", variant: "success" });
    } catch (err) {
      toast({ title: "Dəyişmədi", description: errorMessage(err), variant: "error" });
    } finally {
      setBusyLesson(null);
    }
  }

  async function deleteLesson() {
    if (!lessonToDelete) return;
    setDeletingLesson(true);
    try {
      await requestJson(`/api/lessons/${lessonToDelete.id}`, "DELETE");
      setLessons((prev) => prev.filter((x) => x.id !== lessonToDelete.id));
      setLessonToDelete(null);
      toast({ title: "Dərs silindi", variant: "success" });
    } catch (err) {
      toast({ title: "Silinmədi", description: errorMessage(err), variant: "error" });
    } finally {
      setDeletingLesson(false);
    }
  }

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    const minutes = Number(newLesson.minutes);
    if (!newLesson.title.trim()) return setNewError("Başlıq tələb olunur");
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) return setNewError("Müddət 1–600 dəqiqə olmalıdır");
    setCreating(true);
    setNewError(null);
    try {
      const lesson = await requestJson<{ id: string }>("/api/lessons", "POST", {
        moduleId: mod.id,
        title: newLesson.title.trim(),
        shortDescription: newLesson.shortDescription.trim() || null,
        estimatedMinutes: minutes,
      });
      router.push(`/admin/lessons/${lesson.id}/edit`);
    } catch (err) {
      setNewError(errorMessage(err));
      setCreating(false);
    }
  }

  const totalBlocks = lessons.reduce((s, l) => s + l.blocks, 0);
  const totalLearners = lessons.reduce((s, l) => s + l.learners, 0);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/modules">Modullar</BackLink>
        <PageHeader
          className="mb-0 sm:mb-0"
          title={saved.title || "Modul"}
          description={<span className="inline-flex flex-wrap items-center gap-2"><Badge tone={saved.published ? "pass" : "neutral"}>{saved.published ? "Yayımlanıb" : "Qaralama"}</Badge> {lessons.length} dərs · {totalBlocks} blok</span>}
          actions={
            <>
              <Button variant="danger-ghost" onClick={() => setConfirmModule(true)}><Trash2 className="h-4 w-4" aria-hidden /> Modulu sil</Button>
              <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Dərs əlavə et</Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <section aria-labelledby="lessons-h" className="min-w-0">
          <h2 id="lessons-h" className="mb-3 font-display text-base font-semibold text-ink">Dərslər</h2>
          {lessons.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title="Hələ dərs yoxdur"
              description="İlk dərsi yaradın, sonra redaktorda bloklar əlavə edin."
              action={<Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Dərs əlavə et</Button>}
            />
          ) : (
            <SortableList
              items={lessons}
              onItemsChange={setLessons}
              endpoint={`/api/modules/${mod.id}/lessons`}
              itemName={(l, i) => `Dərs ${i + 1}: ${l.title}`}
              className="space-y-2"
              render={(l, i, handle) => (
                <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2 pr-1.5 sm:gap-3 sm:p-3">
                  {handle}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-semibold tabular-nums text-ink-2">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/lessons/${l.id}/edit`} className={cn("block truncate text-sm font-semibold hover:text-iris", l.published ? "text-ink" : "text-ink-2")}>{l.title}</Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" aria-hidden /> {l.blocks}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {l.minutes} dəq</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden /> {l.learners}</span>
                      <Badge tone={l.published ? "pass" : "neutral"} className="px-2 py-0 text-[0.7rem]">{l.published ? "Yayımda" : "Qaralama"}</Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Tooltip label={l.published ? "Qaralamaya qaytar" : "Yayımla"}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        loading={busyLesson === l.id}
                        aria-label={l.published ? `“${l.title}” dərsini qaralamaya qaytar` : `“${l.title}” dərsini yayımla`}
                        onClick={() => void togglePublish(l)}
                        className={l.published ? "text-pass" : undefined}
                      >
                        {busyLesson !== l.id && (l.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />)}
                      </Button>
                    </Tooltip>
                    <Tooltip label="Önizlə">
                      <a href={`/preview/${l.id}`} target="_blank" rel="noopener noreferrer" aria-label={`“${l.title}” dərsini önizlə (yeni pəncərə)`} className={buttonStyles({ variant: "ghost", size: "icon-sm", className: "hidden xs:inline-flex" })}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Tooltip>
                    <Tooltip label="Redaktə et">
                      <Link href={`/admin/lessons/${l.id}/edit`} aria-label={`“${l.title}” dərsini redaktə et`} className={buttonStyles({ variant: "ghost", size: "icon-sm" })}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Tooltip>
                    <Tooltip label="Sil">
                      <Button variant="danger-ghost" size="icon-sm" aria-label={`“${l.title}” dərsini sil`} onClick={() => setLessonToDelete(l)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              )}
            />
          )}
        </section>

        <Card className="h-fit">
          <CardHeader><CardTitle className="font-display">Modul məlumatları</CardTitle></CardHeader>
          <form onSubmit={saveModule} noValidate className="space-y-5">
            <ModuleFields value={form} onChange={(d) => { setForm(d); setTitleError(undefined); }} titleError={titleError} />
            <div className="flex gap-2 border-t border-line pt-4">
              <Button type="submit" loading={saving} disabled={!dirty} block>{dirty ? "Dəyişiklikləri saxla" : "Saxlanılıb"}</Button>
              {dirty && <Button variant="ghost" onClick={() => setForm(saved)} disabled={saving}>Geri qaytar</Button>}
            </div>
          </form>
        </Card>
      </div>

      <Modal open={newOpen} onOpenChange={(o) => !creating && setNewOpen(o)} title="Yeni dərs" description="Yaratdıqdan sonra redaktor açılacaq. Dərs qaralama kimi saxlanılır.">
        <form onSubmit={createLesson} noValidate className="space-y-4">
          <Field label="Başlıq *">
            {(p) => <Input {...p} autoFocus value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} placeholder="Məs.: Ekvivalent bölmə" maxLength={200} />}
          </Field>
          <Field label="Qısa təsvir">
            {(p) => <Textarea {...p} rows={2} value={newLesson.shortDescription} onChange={(e) => setNewLesson({ ...newLesson, shortDescription: e.target.value })} maxLength={500} />}
          </Field>
          <Field label="Təxmini müddət (dəq)" className="max-w-40">
            {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={600} value={newLesson.minutes} onChange={(e) => setNewLesson({ ...newLesson, minutes: e.target.value })} />}
          </Field>
          {newError && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{newError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setNewOpen(false)} disabled={creating}>Ləğv et</Button>
            <Button type="submit" loading={creating}>Yarat və redaktə et</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModule}
        onOpenChange={setConfirmModule}
        title="Modul silinsin?"
        confirmLabel="Modulu sil"
        loading={deletingModule}
        onConfirm={() => void deleteModule()}
      >
        “{saved.title}” modulu, içindəki <strong>{lessons.length} dərs</strong> və onların bütün blokları silinəcək.
        {totalLearners > 0 && <> Tələbələrin bu dərslər üzrə irəliləyişi və cavabları da itəcək.</>} Bu əməliyyatı geri qaytarmaq olmur.
      </ConfirmModal>

      <ConfirmModal
        open={!!lessonToDelete}
        onOpenChange={(o) => !o && setLessonToDelete(null)}
        title="Dərs silinsin?"
        confirmLabel="Dərsi sil"
        loading={deletingLesson}
        onConfirm={() => void deleteLesson()}
      >
        “{lessonToDelete?.title}” dərsi və onun {lessonToDelete?.blocks ?? 0} bloku silinəcək.
        {lessonToDelete && lessonToDelete.learners > 0 && <> <strong>{lessonToDelete.learners} tələbənin</strong> irəliləyişi və cavabları da itəcək.</>}
      </ConfirmModal>
    </div>
  );
}

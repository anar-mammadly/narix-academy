"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import Link from "next/link";
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors,
  type Announcements, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxisSafe } from "./dnd";
import { ChevronsDownUp, ChevronsUpDown, ExternalLink, FileJson, Layers, Plus, Settings2 } from "lucide-react";
import { INTERACTIVE_BLOCKS, type BlockType } from "@/types/blocks";
import { BLOCK_XP } from "@/lib/game";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { BackLink } from "../BackLink";
import { ConfirmModal } from "../ConfirmModal";
import { errorMessage, requestJson } from "../request";
import { AddBlockPicker } from "./AddBlockPicker";
import { BlockCard } from "./BlockCard";
import { ImportJsonModal } from "./ImportJsonModal";
import { LessonSettingsPanel, validateSettings, type SettingsDraft } from "./LessonSettingsPanel";
import { SaveIndicator, type IndicatorState } from "./SaveIndicator";
import { BLOCK_META, defaultContent, isBlockType } from "./block-meta";
import type { CardStatus, EditorBlock, EditorLesson, ModuleOption } from "./types";

function toDraft(l: EditorLesson): SettingsDraft {
  return {
    title: l.title,
    slug: l.slug,
    shortDescription: l.shortDescription ?? "",
    estimatedMinutes: String(l.estimatedMinutes),
    minQuizScore: l.minQuizScore == null ? "" : String(l.minQuizScore),
    published: l.published,
    moduleId: l.moduleId,
  };
}

const sameDraft = (a: SettingsDraft, b: SettingsDraft) => (Object.keys(a) as (keyof SettingsDraft)[]).every((k) => a[k] === b[k]);

const label = (blocks: EditorBlock[], id: string | number) => {
  const i = blocks.findIndex((b) => b.id === id);
  const b = blocks[i];
  return b ? `${i + 1}. ${isBlockType(b.type) ? BLOCK_META[b.type].label : b.type}` : "blok";
};

export function LessonEditor({ lesson: initialLesson, blocks: initialBlocks, modules }: { lesson: EditorLesson; blocks: EditorBlock[]; modules: ModuleOption[] }) {
  const toast = useToast();
  const [lesson, setLesson] = useState(initialLesson);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialBlocks.length <= 3 ? initialBlocks.map((b) => b.id) : []));
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({});

  const [picker, setPicker] = useState<{ open: boolean; afterId: string | null }>({ open: false, afterId: null });
  const [adding, setAdding] = useState<BlockType | null>(null);
  const [toDelete, setToDelete] = useState<EditorBlock | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Lesson settings ─────────────────────────────────────────
  const [draft, setDraft] = useState(() => toDraft(initialLesson));
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const saved = useMemo(() => toDraft(lesson), [lesson]);
  const dirty = !sameDraft(draft, saved);
  const settingsErrors = showErrors ? validateSettings(draft) : {};

  async function saveSettings() {
    const errs = validateSettings(draft);
    setShowErrors(true);
    if (Object.keys(errs).length) return;
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const body = {
        title: draft.title.trim(),
        slug: draft.slug.trim(),
        shortDescription: draft.shortDescription.trim() || null,
        estimatedMinutes: Number(draft.estimatedMinutes),
        minQuizScore: draft.minQuizScore.trim() === "" ? null : Number(draft.minQuizScore),
        published: draft.published,
        moduleId: draft.moduleId,
      };
      const res = await requestJson<EditorLesson>(`/api/lessons/${lesson.id}`, "PATCH", body);
      setLesson({
        id: res.id, title: res.title, slug: res.slug, shortDescription: res.shortDescription, estimatedMinutes: res.estimatedMinutes,
        minQuizScore: res.minQuizScore, published: res.published, moduleId: res.moduleId,
      });
      setDraft(toDraft(res));
      setShowErrors(false);
      toast({ title: "Dərs parametrləri saxlanıldı", variant: "success" });
    } catch (e) {
      setSettingsError(errorMessage(e));
    } finally {
      setSavingSettings(false);
    }
  }

  // ── Block statuses ──────────────────────────────────────────
  const onStatus = useCallback((id: string, s: CardStatus) => {
    setStatuses((prev) => (prev[id] === s ? prev : { ...prev, [id]: s }));
  }, []);

  const overall: IndicatorState = useMemo(() => {
    const list = blocks.map((b) => statuses[b.id] ?? "idle");
    if (list.includes("error")) return "error";
    if (list.includes("saving") || list.includes("pending")) return "saving";
    if (list.includes("invalid")) return "invalid";
    if (list.includes("saved")) return "saved";
    return "idle";
  }, [blocks, statuses]);
  const invalidCount = blocks.filter((b) => statuses[b.id] === "invalid").length;

  // Warn before leaving with unsaved block edits or settings.
  const unsafe = overall === "saving" || overall === "error" || dirty;
  useEffect(() => {
    if (!unsafe) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unsafe]);

  // ── Expand / collapse ───────────────────────────────────────
  const onToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const allExpanded = blocks.length > 0 && blocks.every((b) => expanded.has(b.id));

  function reveal(id: string) {
    setExpanded((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      const el = document.getElementById(`block-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.querySelector<HTMLElement>("input, textarea, [role=radio], button[aria-expanded]")?.focus({ preventScroll: true });
    });
  }

  // ── Create / duplicate / delete ─────────────────────────────
  async function createBlock(payload: { type: string; title: string | null; content: unknown }, afterId: string | null) {
    const block = await requestJson<EditorBlock>(`/api/lessons/${lesson.id}/blocks`, "POST", { ...payload, afterId });
    setBlocks((prev) => {
      const at = afterId ? prev.findIndex((b) => b.id === afterId) + 1 : prev.length;
      const next = prev.slice();
      next.splice(at, 0, block);
      return next;
    });
    reveal(block.id);
    return block;
  }

  async function addBlock(type: BlockType) {
    setAdding(type);
    try {
      await createBlock({ type, title: null, content: defaultContent(type) }, picker.afterId);
      setPicker({ open: false, afterId: null });
    } catch (e) {
      toast({ title: "Blok əlavə olunmadı", description: errorMessage(e), variant: "error" });
    } finally {
      setAdding(null);
    }
  }

  const onDuplicate = useCallback(
    async (b: EditorBlock) => {
      try {
        await createBlock({ type: b.type, title: b.title, content: b.content }, b.id);
        toast({ title: "Blok kopyalandı", variant: "success" });
      } catch (e) {
        toast({ title: "Kopyalanmadı", description: errorMessage(e), variant: "error" });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lesson.id]
  );

  const onInsertAfter = useCallback((id: string) => setPicker({ open: true, afterId: id }), []);
  const onDelete = useCallback((b: EditorBlock) => setToDelete(b), []);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await requestJson(`/api/lessons/${lesson.id}/blocks/${toDelete.id}`, "DELETE");
      setBlocks((prev) => prev.filter((b) => b.id !== toDelete.id));
      setStatuses((prev) => {
        const next = { ...prev };
        delete next[toDelete.id];
        return next;
      });
      setToDelete(null);
      toast({ title: "Blok silindi", variant: "success" });
    } catch (e) {
      toast({ title: "Silinmədi", description: errorMessage(e), variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  // ── Reorder (one request per drop, serialised) ──────────────
  const reorderChain = useRef<Promise<void>>(Promise.resolve());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const prev = blocks;
    const next = arrayMove(prev, prev.findIndex((b) => b.id === active.id), prev.findIndex((b) => b.id === over.id));
    setBlocks(next);
    const order = next.map((b) => b.id);
    reorderChain.current = reorderChain.current.then(async () => {
      try {
        await requestJson(`/api/lessons/${lesson.id}/blocks`, "PATCH", { order });
      } catch (e) {
        setBlocks(prev);
        toast({ title: "Sıralama saxlanmadı", description: errorMessage(e), variant: "error" });
      }
    });
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${label(blocks, active.id)} götürüldü.`,
    onDragOver: ({ active, over }) => (over ? `${label(blocks, active.id)} indi ${label(blocks, over.id)} mövqeyindədir.` : `${label(blocks, active.id)} siyahıdan kənardadır.`),
    onDragEnd: ({ active, over }) => (over ? `${label(blocks, active.id)} ${blocks.findIndex((b) => b.id === over.id) + 1} nömrəli yerə qoyuldu.` : "Sürüşdürmə ləğv edildi."),
    onDragCancel: () => "Sürüşdürmə ləğv edildi.",
  };

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const known = blocks.map((b) => b.type).filter(isBlockType);
    return {
      blocks: blocks.length,
      interactive: known.filter((t) => INTERACTIVE_BLOCKS.includes(t)).length,
      xp: known.reduce((s, t) => s + (BLOCK_XP[t] ?? 0), 0),
    };
  }, [blocks]);

  const settingsPanel = (
    <LessonSettingsPanel
      draft={draft}
      onChange={(d) => {
        setDraft(d);
        setSettingsError(null);
      }}
      errors={settingsErrors}
      modules={modules}
      dirty={dirty}
      saving={savingSettings}
      serverError={settingsError}
      onSave={() => void saveSettings()}
      onReset={() => {
        setDraft(saved);
        setShowErrors(false);
        setSettingsError(null);
      }}
      stats={stats}
    />
  );

  const moduleTitle = modules.find((m) => m.id === lesson.moduleId)?.title ?? "Modul";

  const dndId = useId();
  return (
    <div>
      <BackLink href={`/admin/modules/${lesson.moduleId}/edit`}>{moduleTitle}</BackLink>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge tone={lesson.published ? "pass" : "neutral"}>{lesson.published ? "Yayımlanıb" : "Qaralama"}</Badge>
            <SaveIndicator
              state={overall}
              labels={{ saved: "Bütün dəyişikliklər saxlanıldı", invalid: `${invalidCount} blokda düzəliş lazımdır`, error: "Bəzi dəyişikliklər saxlanmadı" }}
            />
          </div>
          <h1 className="break-words font-display text-2xl font-semibold text-ink sm:text-[1.75rem]">{lesson.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-4 w-4" aria-hidden /> Parametrlər{dirty && <span className="h-2 w-2 rounded-full bg-xp-bright" aria-label="saxlanmamış dəyişiklik" />}
          </Button>
          <Link href={`/preview/${lesson.id}`} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "secondary" })}>
            <ExternalLink className="h-4 w-4" aria-hidden /> Önizlə<span className="sr-only"> (yeni pəncərədə açılır)</span>
          </Link>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <FileJson className="h-4 w-4" aria-hidden /> JSON idxal
          </Button>
          <Button onClick={() => setPicker({ open: true, afterId: null })}>
            <Plus className="h-4 w-4" aria-hidden /> Blok əlavə et
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="blocks-heading" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="blocks-heading" className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <Layers className="h-4 w-4 text-muted" aria-hidden /> Bloklar <span className="text-muted">({blocks.length})</span>
            </h2>
            {blocks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(allExpanded ? new Set() : new Set(blocks.map((b) => b.id)))}
              >
                {allExpanded ? <ChevronsDownUp className="h-4 w-4" aria-hidden /> : <ChevronsUpDown className="h-4 w-4" aria-hidden />}
                {allExpanded ? "Hamısını yığ" : "Hamısını aç"}
              </Button>
            )}
          </div>

          {blocks.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title="Dərs hələ boşdur"
              description="İlk bloku əlavə edin və ya hazır JSON məzmunu idxal edin."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setPicker({ open: true, afterId: null })}><Plus className="h-4 w-4" aria-hidden /> Blok əlavə et</Button>
                  <Button variant="secondary" onClick={() => setImportOpen(true)}><FileJson className="h-4 w-4" aria-hidden /> JSON idxal</Button>
                </div>
              }
            />
          ) : (
            <DndContext id={dndId}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
              modifiers={[restrictToVerticalAxisSafe]}
              accessibility={{
                announcements,
                screenReaderInstructions: {
                  draggable: "Bloku götürmək üçün Boşluq və ya Enter basın. Ox düymələri ilə yerini dəyişin, yenidən Boşluq/Enter ilə qoyun, Esc ilə ləğv edin.",
                },
              }}
            >
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ol className="space-y-2.5" aria-label="Dərs blokları">
                  {blocks.map((b, i) => (
                    <BlockCard
                      key={b.id}
                      lessonId={lesson.id}
                      block={b}
                      index={i}
                      expanded={expanded.has(b.id)}
                      onToggle={onToggle}
                      onStatus={onStatus}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onInsertAfter={onInsertAfter}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}

          {blocks.length > 0 && (
            <button
              type="button"
              onClick={() => setPicker({ open: true, afterId: null })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong py-4 text-sm font-semibold text-muted transition-colors hover:border-iris/60 hover:bg-iris-soft/40 hover:text-iris-ink"
            >
              <Plus className="h-4 w-4" aria-hidden /> Sona blok əlavə et
            </button>
          )}
        </section>

        <aside aria-label="Dərs parametrləri" className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 font-display text-base font-semibold text-ink">Dərs parametrləri</h2>
            {settingsPanel}
          </div>
        </aside>
      </div>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen} title="Dərs parametrləri">
        {settingsPanel}
      </Sheet>

      <AddBlockPicker open={picker.open} onOpenChange={(o) => setPicker((p) => ({ open: o, afterId: o ? p.afterId : null }))} onPick={(t) => void addBlock(t)} busyType={adding} />

      <ImportJsonModal
        open={importOpen}
        onOpenChange={setImportOpen}
        lessonId={lesson.id}
        existingCount={blocks.length}
        onImported={(next, count) => {
          setBlocks(next);
          setStatuses({});
          setExpanded(new Set(next.length <= 3 ? next.map((b) => b.id) : []));
          toast({ title: `${count} blok idxal edildi`, variant: "success" });
        }}
      />

      <ConfirmModal
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Blok silinsin?"
        confirmLabel="Sil"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      >
        {toDelete && isBlockType(toDelete.type) && INTERACTIVE_BLOCKS.includes(toDelete.type) ? (
          <>“{BLOCK_META[toDelete.type].label}” bloku və <strong>tələbələrin bu bloka verdiyi cavablar</strong> həmişəlik silinəcək.</>
        ) : toDelete?.type === "TASK" ? (
          <>Tapşırıq və <strong>tələbələrin göndərdiyi cavablar</strong> həmişəlik silinəcək.</>
        ) : (
          <>Bu blok həmişəlik silinəcək.</>
        )}
      </ConfirmModal>
    </div>
  );
}

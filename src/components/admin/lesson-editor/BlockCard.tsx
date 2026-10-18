"use client";

import { memo, useCallback, useEffect, useId, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Braces, ChevronDown, Copy, GripVertical, ListPlus, RotateCw, Trash2, FormInput } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOCK_XP } from "@/lib/game";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { BLOCK_META, JSON_ONLY, NO_TITLE, isBlockType } from "./block-meta";
import { BlockForm, hasForm } from "./editors";
import { JsonEditor } from "./editors/JsonEditor";
import { SaveIndicator } from "./SaveIndicator";
import { blockSummary } from "./summary";
import { checkBlock } from "./validate";
import { useBlockAutosave } from "./useBlockAutosave";
import type { CardStatus, EditorBlock } from "./types";

const toneTile: Record<string, string> = {
  neutral: "bg-surface-2 text-ink-2",
  iris: "bg-iris-soft text-iris-ink",
  pass: "bg-pass-soft text-pass",
  bug: "bg-bug-soft text-bug",
  xp: "bg-xp-soft text-xp",
  sky: "bg-sky-soft text-sky",
  flame: "bg-flame-soft text-flame",
};

export type BlockCardProps = {
  lessonId: string;
  block: EditorBlock;
  index: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  onStatus: (id: string, status: CardStatus) => void;
  onDelete: (block: EditorBlock) => void;
  onDuplicate: (block: EditorBlock) => void;
  onInsertAfter: (id: string) => void;
};

export const BlockCard = memo(function BlockCard(props: BlockCardProps) {
  const { block, index, expanded } = props;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (!isBlockType(block.type)) {
    return (
      <li ref={setNodeRef} style={style} className="rounded-xl border border-bug/40 bg-bug-soft/40 p-3">
        <div className="flex items-center gap-2">
          <button ref={setActivatorNodeRef} {...attributes} {...listeners} type="button" aria-label={`Bloku sürüşdür: ${index + 1}`} className="grid h-9 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-surface-2">
            <GripVertical className="h-4 w-4" />
          </button>
          <AlertTriangle className="h-4 w-4 shrink-0 text-bug" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-ink-2">Naməlum blok tipi “{block.type}”. Tələbəyə göstərilmir.</p>
          <Button variant="danger-ghost" size="sm" onClick={() => props.onDelete(block)}><Trash2 className="h-4 w-4" aria-hidden /> Sil</Button>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      id={`block-${block.id}`}
      className={cn(
        "scroll-mt-24 rounded-xl border border-line bg-surface transition-shadow",
        isDragging && "relative z-10 shadow-lift ring-2 ring-iris/40",
        expanded && "shadow-pop"
      )}
    >
      <KnownBlock {...props} dragHandle={
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={`Bloku sürüşdür: ${index + 1}. ${BLOCK_META[block.type].label}`}
          className="grid h-9 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink active:cursor-grabbing sm:w-9"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      } />
    </li>
  );
});

function KnownBlock({ lessonId, block, index, expanded, onToggle, onStatus, onDelete, onDuplicate, onInsertAfter, dragHandle }: BlockCardProps & { dragHandle: React.ReactNode }) {
  const type = block.type as keyof typeof BLOCK_META;
  const meta = BLOCK_META[type];
  const Icon = meta.icon;
  const bodyId = useId();
  const titleId = useId();

  const [title, setTitle] = useState(block.title ?? "");
  const [content, setContent] = useState<unknown>(block.content);
  const [initialCheck] = useState(() => checkBlock(type, block.title, block.content));
  const [issues, setIssues] = useState<string[] | null>(initialCheck.ok ? null : initialCheck.issues);
  const formAvailable = hasForm(type) && !JSON_ONLY.includes(type);
  // Content that does not validate opens in JSON mode so a form never meets an unexpected shape.
  const [mode, setMode] = useState<"form" | "json">(formAvailable && initialCheck.ok ? "form" : "json");
  const [jsonKey, setJsonKey] = useState(0);

  const { status, error, schedule, flush } = useBlockAutosave(lessonId, block.id);

  useEffect(() => {
    onStatus(block.id, issues ? "invalid" : status);
  }, [block.id, issues, status, onStatus]);

  const apply = useCallback(
    (nextTitle: string, nextContent: unknown) => {
      const result = checkBlock(type, nextTitle || null, nextContent);
      if (!result.ok) {
        setIssues(result.issues);
        return;
      }
      setIssues(null);
      schedule({ title: nextTitle.trim() ? nextTitle.trim() : null, content: nextContent });
    },
    [type, schedule]
  );

  const changeContent = (next: unknown) => {
    setContent(next);
    apply(title, next);
  };
  const changeTitle = (next: string) => {
    setTitle(next);
    apply(next, content);
  };

  const switchMode = (next: "form" | "json") => {
    if (next === "form" && issues) return;
    setMode(next);
    setJsonKey((k) => k + 1);
  };

  const summary = blockSummary(type, content);
  const xp = BLOCK_XP[type];
  const indicator = issues ? "invalid" : status;

  return (
    <>
      <div className="flex items-center gap-1.5 p-2 sm:gap-2 sm:p-2.5">
        {dragHandle}
        <span aria-hidden className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", toneTile[meta.tone])}>
          <Icon className="h-4 w-4" />
        </span>
        <button
          type="button"
          onClick={() => onToggle(block.id)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-muted">{index + 1}</span>
              <span className="truncate text-sm font-semibold text-ink">{title || meta.label}</span>
              {xp ? <span className="hidden shrink-0 rounded-full bg-xp-soft px-1.5 text-[0.7rem] font-semibold text-xp xs:inline">+{xp} XP</span> : null}
            </span>
            {summary && <span className="mt-0.5 block truncate text-xs text-muted">{title ? `${meta.label} · ` : ""}{summary}</span>}
          </span>
          <SaveIndicator state={indicator} className="hidden sm:inline-flex" />
          <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
        </button>
      </div>
      {/* Status stays visible on phones too, under the header. */}
      {indicator !== "idle" && (
        <div className="-mt-1 px-3 pb-2 sm:hidden">
          <SaveIndicator state={indicator} />
        </div>
      )}

      <div id={bodyId} hidden={!expanded} className="border-t border-line">
        {expanded && (
          <div className="space-y-4 p-3 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">{meta.description}</p>
              {formAvailable && (
                <div role="group" aria-label="Redaktə rejimi" className="inline-flex rounded-lg bg-surface-2 p-0.5">
                  <button
                    type="button"
                    aria-pressed={mode === "form"}
                    disabled={!!issues && mode === "json"}
                    title={issues && mode === "json" ? "Formaya keçmək üçün əvvəlcə xətaları düzəldin" : undefined}
                    onClick={() => switchMode("form")}
                    className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold disabled:opacity-50", mode === "form" ? "bg-surface text-ink shadow-pop" : "text-muted hover:text-ink")}
                  >
                    <FormInput className="h-3.5 w-3.5" aria-hidden /> Forma
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "json"}
                    onClick={() => switchMode("json")}
                    className={cn("flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold", mode === "json" ? "bg-surface text-ink shadow-pop" : "text-muted hover:text-ink")}
                  >
                    <Braces className="h-3.5 w-3.5" aria-hidden /> JSON
                  </button>
                </div>
              )}
            </div>

            {!NO_TITLE.includes(type) && (
              <div>
                <Label htmlFor={titleId}>Blok başlığı (istəyə bağlı)</Label>
                <Input id={titleId} value={title} onChange={(e) => changeTitle(e.target.value)} placeholder={meta.label} maxLength={200} />
              </div>
            )}

            {mode === "form" && formAvailable ? (
              <BlockForm type={type} value={content} onChange={changeContent} blockId={block.id} />
            ) : (
              <JsonEditor key={jsonKey} value={content} onChange={changeContent} />
            )}

            {issues && (
              <div role="alert" className="rounded-lg border border-xp/40 bg-xp-soft p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-xp">
                  <AlertTriangle className="h-4 w-4" aria-hidden /> Yoxlamadan keçmədi — düzəldənə qədər saxlanılmır
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-ink-2">
                  {issues.slice(0, 8).map((m) => <li key={m}>{m}</li>)}
                  {issues.length > 8 && <li>və daha {issues.length - 8} xəta</li>}
                </ul>
              </div>
            )}

            {status === "error" && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-bug-soft p-3 text-sm text-bug">
                <span>Saxlanmadı: {error}</span>
                <Button variant="secondary" size="sm" onClick={() => void flush()}><RotateCw className="h-4 w-4" aria-hidden /> Yenidən cəhd</Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1 border-t border-line pt-3">
              <Button variant="ghost" size="sm" onClick={() => onInsertAfter(block.id)}><ListPlus className="h-4 w-4" aria-hidden /> Altına blok</Button>
              <Button variant="ghost" size="sm" onClick={() => onDuplicate({ ...block, title: title || null, content })}><Copy className="h-4 w-4" aria-hidden /> Kopyala</Button>
              <Button variant="danger-ghost" size="sm" className="ml-auto" onClick={() => onDelete(block)}><Trash2 className="h-4 w-4" aria-hidden /> Sil</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

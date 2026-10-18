"use client";

import { useMemo, useState, useId } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BlockShell, Feedback, InlineError, seededShuffle, useAttempt, type InteractiveProps } from "../shared";
import { RichText, renderInline } from "../RichText";
import type { OrderingContent } from "@/types/blocks";

function Row({
  id, text, index, total, state, onMove, disabled,
}: { id: string; text: string; index: number; total: number; state: "idle" | "right" | "wrong"; onMove: (from: number, to: number) => void; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 bg-surface py-2 pl-2 pr-1.5",
        isDragging && "z-10 border-iris shadow-lift",
        state === "right" ? "border-pass bg-pass-soft" : state === "wrong" ? "border-bug bg-bug-soft" : !isDragging && "border-line"
      )}
    >
      <button
        className="grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-surface-2 active:cursor-grabbing disabled:cursor-default"
        aria-label={`Sürüşdür: ${text}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-xs font-semibold text-ink-2">{index + 1}</span>
      <span className="min-w-0 flex-1 text-[0.97rem] text-ink">{renderInline(text)}</span>
      <div className="flex shrink-0 flex-col">
        <button className="grid h-6 w-8 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30" disabled={disabled || index === 0} onClick={() => onMove(index, index - 1)} aria-label="Yuxarı qaldır">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button className="grid h-6 w-8 place-items-center rounded text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30" disabled={disabled || index === total - 1} onClick={() => onMove(index, index + 1)} aria-label="Aşağı endir">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function Ordering(props: InteractiveProps<OrderingContent>) {
  const { items } = props.content;
  const { result, pending, error, submit, reset } = useAttempt(props);
  const initialOrder = useMemo(() => {
    const saved = props.initial?.answer?.order as string[] | undefined;
    if (saved?.length === items.length) return saved;
    let s = seededShuffle(items, props.blockId);
    if (s.every((v, i) => v === items[i]) && items.length > 1) s = [...s.slice(1), s[0]];
    return s;
  }, [items, props.blockId, props.initial]);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const locked = result != null;

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    setOrder((o) => arrayMove(o, o.indexOf(String(e.active.id)), o.indexOf(String(e.over!.id))));
  }

  const dndId = useId();
  return (
    <BlockShell type="ORDERING" title={props.title} passed={result?.passed}>
      <RichText text={props.content.instructions} className="mb-4" />
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="grid gap-2" aria-label="Sıralanacaq elementlər">
            {order.map((text, i) => (
              <Row
                key={text}
                id={text}
                text={text}
                index={i}
                total={order.length}
                disabled={locked}
                state={locked ? (items[i] === text ? "right" : "wrong") : "idle"}
                onMove={(from, to) => setOrder((o) => arrayMove(o, from, to))}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <InlineError message={error} />
      {result ? (
        <Feedback
          result={result}
          successText="Sıra düzgündür!"
          failText="Bəzi addımlar yerində deyil"
          explanation={props.content.explanation ? <RichText text={props.content.explanation} /> : undefined}
          onRetry={result.passed ? undefined : reset}
        />
      ) : (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => submit({ order })} loading={pending} className="w-full sm:w-auto">Yoxla</Button>
        </div>
      )}
    </BlockShell>
  );
}

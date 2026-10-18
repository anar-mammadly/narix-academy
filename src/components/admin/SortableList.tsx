"use client";

import { useRef, type ReactNode, useId } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { restrictToVerticalAxisSafe } from "./lesson-editor/dnd";
import { errorMessage, requestJson } from "./request";

type Item = { id: string };

/**
 * Vertical drag-and-drop list (pointer, touch and keyboard). On drop the new order is
 * applied optimistically and sent as ONE PATCH { order } to `endpoint`; reverted on failure.
 */
export function SortableList<T extends Item>({
  items, onItemsChange, endpoint, itemName, render, className,
}: {
  items: T[];
  onItemsChange: (items: T[]) => void;
  endpoint: string;
  itemName: (item: T, index: number) => string;
  render: (item: T, index: number, handle: ReactNode) => ReactNode;
  className?: string;
}) {
  const toast = useToast();
  const chain = useRef<Promise<void>>(Promise.resolve());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const name = (id: string | number) => {
    const i = items.findIndex((x) => x.id === id);
    return i >= 0 ? itemName(items[i], i) : "element";
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const prev = items;
    const next = arrayMove(prev, prev.findIndex((x) => x.id === active.id), prev.findIndex((x) => x.id === over.id));
    onItemsChange(next);
    const order = next.map((x) => x.id);
    chain.current = chain.current.then(async () => {
      try {
        await requestJson(endpoint, "PATCH", { order });
      } catch (e) {
        onItemsChange(prev);
        toast({ title: "Sıralama saxlanmadı", description: errorMessage(e), variant: "error" });
      }
    });
  }

  const dndId = useId();
  return (
    <DndContext id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxisSafe]}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `${name(active.id)} götürüldü.`,
          onDragOver: ({ active, over }) => (over ? `${name(active.id)} indi ${name(over.id)} yerindədir.` : "Siyahıdan kənar."),
          onDragEnd: ({ active, over }) => (over ? `${name(active.id)} yerləşdirildi.` : "Ləğv edildi."),
          onDragCancel: () => "Sürüşdürmə ləğv edildi.",
        },
        screenReaderInstructions: {
          draggable: "Götürmək üçün Boşluq və ya Enter basın, ox düymələri ilə yerini dəyişin, yenidən Boşluq/Enter ilə qoyun, Esc ilə ləğv edin.",
        },
      }}
    >
      <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        <ol className={className}>
          {items.map((item, i) => (
            <SortableRow key={item.id} id={item.id} label={itemName(item, i)}>
              {(handle) => render(item, i, handle)}
            </SortableRow>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, label, children }: { id: string; label: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      aria-label={`Sürüşdür: ${label}`}
      className="grid h-9 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "relative z-10")}>
      {children(handle)}
    </li>
  );
}

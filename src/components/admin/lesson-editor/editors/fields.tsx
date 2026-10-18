"use client";

import { useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Field, Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export function TextField({
  label, value, onChange, placeholder, hint, multiline, rows, mono, className, required,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  className?: string;
  required?: boolean;
}) {
  return (
    <Field label={required ? `${label} *` : label} hint={hint} className={className}>
      {(p) =>
        multiline ? (
          <Textarea
            {...p}
            rows={rows ?? 4}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={!mono}
            className={cn(mono && "font-mono text-sm leading-relaxed")}
          />
        ) : (
          <Input {...p} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cn(mono && "font-mono text-sm")} />
        )
      }
    </Field>
  );
}

export function NumberField({
  label, value, onChange, min, max, hint, className,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; hint?: string; className?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(p) => (
        <Input
          {...p}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label, value, onChange, options, className,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onValueChange={onChange} options={options} />
    </div>
  );
}

/** Small radio group rendered as a segmented control. */
export function Segmented<T extends string | number>({
  label, value, onChange, options, className,
}: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; ariaLabel?: string }[]; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <span id={id} className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      <div role="radiogroup" aria-labelledby={id} className="flex max-w-full flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={o.ariaLabel}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex h-9 min-w-10 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                active ? "bg-surface text-ink shadow-pop" : "text-muted hover:text-ink"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Generic list editor: move up/down, remove, add. */
export function ListEditor<T>({
  label, items, onChange, create, render, itemLabel, addLabel = "Əlavə et", min = 0, max = Infinity, getKey, className,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (next: T) => void, index: number) => ReactNode;
  itemLabel: (index: number) => string;
  addLabel?: string;
  min?: number;
  max?: number;
  getKey?: (item: T, index: number) => string;
  className?: string;
}) {
  const list = Array.isArray(items) ? items : [];
  const move = (from: number, to: number) => {
    const next = list.slice();
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-2 text-sm font-medium text-ink-2">{label}</legend>
      <ol className="space-y-2.5">
        {list.map((item, i) => (
          <li key={getKey ? getKey(item, i) : i} className="rounded-lg border border-line bg-surface-2/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{itemLabel(i)}</span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-sm" aria-label={`${itemLabel(i)}: yuxarı`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`${itemLabel(i)}: aşağı`} disabled={i === list.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="danger-ghost"
                  size="icon-sm"
                  aria-label={`${itemLabel(i)}: sil`}
                  disabled={list.length <= min}
                  onClick={() => onChange(list.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {render(item, (next) => onChange(list.map((x, j) => (j === i ? next : x))), i)}
          </li>
        ))}
      </ol>
      {list.length < max && (
        <Button variant="soft" size="sm" className="mt-2.5" onClick={() => onChange([...list, create()])}>
          <Plus className="h-4 w-4" aria-hidden /> {addLabel}
        </Button>
      )}
    </fieldset>
  );
}

/** List of plain strings, one input per row. */
export function StringListEditor({
  label, items, onChange, itemLabel, addLabel, placeholder, min = 1, multiline,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  itemLabel: (i: number) => string;
  addLabel?: string;
  placeholder?: string;
  min?: number;
  multiline?: boolean;
}) {
  return (
    <ListEditor
      label={label}
      items={items}
      onChange={onChange}
      create={() => ""}
      min={min}
      itemLabel={itemLabel}
      addLabel={addLabel}
      render={(value, update, i) =>
        multiline ? (
          <Textarea aria-label={itemLabel(i)} rows={2} value={value} placeholder={placeholder} onChange={(e) => update(e.target.value)} />
        ) : (
          <Input aria-label={itemLabel(i)} value={value} placeholder={placeholder} onChange={(e) => update(e.target.value)} />
        )
      }
    />
  );
}

export function MarkdownHint() {
  return (
    <span>
      Format: <code className="rounded bg-surface-3 px-1">**qalın**</code>, <code className="rounded bg-surface-3 px-1">*maili*</code>,{" "}
      <code className="rounded bg-surface-3 px-1">`kod`</code>, <code className="rounded bg-surface-3 px-1">[keçid](https://…)</code>, “- ” siyahı
    </span>
  );
}

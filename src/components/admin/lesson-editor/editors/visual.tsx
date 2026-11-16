"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fieldStyles } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { ChartContent, ChartKind } from "@/types/blocks";
import { ChartBlock } from "@/components/lesson/blocks/Chart";
import type { EditorProps } from "../types";
import { TextField } from "./fields";

const KINDS: { value: ChartKind; label: string }[] = [
  { value: "bar", label: "Üfüqi sütunlar" },
  { value: "columns", label: "Şaquli sütunlar" },
  { value: "line", label: "Xətt" },
  { value: "donut", label: "Dairə (pay)" },
  { value: "pyramid", label: "Piramida" },
];

/** Numbers in, picture out: the preview under the form is what students see. */
export function ChartEditor({ value, onChange }: EditorProps<ChartContent>) {
  const data = value.data ?? [];
  const set = (patch: Partial<ChartContent>) => onChange({ ...value, ...patch });
  const setRow = (i: number, patch: Partial<ChartContent["data"][number]>) =>
    set({ data: data.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Qrafikin növü
          <select value={value.kind} onChange={(e) => set({ kind: e.target.value as ChartKind })} className={cn(fieldStyles, "h-10")}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </label>
        <TextField label="Vahid" value={value.unit ?? ""} onChange={(unit) => set({ unit })} placeholder="%, san, test…" hint="Hər rəqəmdən sonra yazılır" />
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Dəyərlər{value.kind === "pyramid" && <span className="font-normal text-muted"> (birinci sətir piramidanın zirvəsidir)</span>}</legend>
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <input aria-label={`Ad ${i + 1}`} value={d.label} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="Ad" className={cn(fieldStyles, "h-10 min-w-0 flex-1")} />
            <input
              aria-label={`Rəqəm ${i + 1}`}
              type="number"
              min={0}
              step="any"
              value={Number.isFinite(d.value) ? d.value : 0}
              onChange={(e) => setRow(i, { value: Math.max(0, Number(e.target.value) || 0) })}
              className={cn(fieldStyles, "h-10 w-24 tabular-nums")}
            />
            <Button variant="danger-ghost" size="sm" disabled={data.length <= 2} onClick={() => set({ data: data.filter((_, j) => j !== i) })} aria-label={`Sətri sil: ${d.label || i + 1}`}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ))}
        <div>
          <Button variant="secondary" size="sm" disabled={data.length >= 12} onClick={() => set({ data: [...data, { label: "Yeni", value: 10 }] })}>
            <Plus className="h-4 w-4" aria-hidden /> Sətir əlavə et
          </Button>
        </div>
      </fieldset>

      <TextField label="Altyazı" value={value.caption ?? ""} onChange={(caption) => set({ caption })} placeholder="Qrafik nəyi göstərir, mənbə nədir" />

      <div>
        <p className="mb-2 text-xs font-medium text-muted">Önizləmə</p>
        <ChartBlock c={value} />
      </div>
    </div>
  );
}

"use client";

import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BugHuntContent, BugHuntScenario, CategorizeContent, OrderingContent, QuizContent, QuizQuestion, TaskContent } from "@/types/blocks";
import { BUG_HUNT_SCENARIOS } from "@/lib/bug-hunt";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { Switch } from "../../Switch";
import { uid } from "../block-meta";
import type { EditorProps } from "../types";
import { ListEditor, StringListEditor, TextField } from "./fields";

// ── Quiz ───────────────────────────────────────────────────────

function QuestionEditor({ q, index, onChange }: { q: QuizQuestion; index: number; onChange: (q: QuizQuestion) => void }) {
  const group = useId();
  const options = Array.isArray(q.options) ? q.options : [];

  const removeOption = (i: number) => {
    const next = options.filter((_, j) => j !== i);
    // Keep the same option marked correct when an earlier one is removed.
    const correctIndex = q.correctIndex === i ? 0 : q.correctIndex > i ? q.correctIndex - 1 : q.correctIndex;
    onChange({ ...q, options: next, correctIndex });
  };

  return (
    <div className="space-y-3">
      <TextField label="Sual" required multiline rows={2} value={q.text} onChange={(text) => onChange({ ...q, text })} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink-2">Variantlar (düzgün cavabı seçin)</legend>
        <ul className="space-y-2">
          {options.map((opt, i) => {
            const correct = q.correctIndex === i;
            return (
              <li key={i} className={cn("flex items-center gap-2 rounded-lg border p-1.5 pl-3 transition-colors", correct ? "border-pass/50 bg-pass-soft/60" : "border-line bg-surface")}>
                <input
                  type="radio"
                  name={group}
                  checked={correct}
                  onChange={() => onChange({ ...q, correctIndex: i })}
                  aria-label={`Sual ${index + 1}: variant ${i + 1} düzgün cavabdır`}
                  className="h-4 w-4 shrink-0 accent-[var(--c-pass)]"
                />
                <Input
                  aria-label={`Sual ${index + 1}, variant ${i + 1}`}
                  value={opt}
                  placeholder={`Variant ${i + 1}`}
                  onChange={(e) => onChange({ ...q, options: options.map((o, j) => (j === i ? e.target.value : o)) })}
                  className="h-10 border-transparent bg-transparent"
                />
                {correct && <span className="hidden shrink-0 text-xs font-semibold text-pass sm:inline">Düzgün</span>}
                <Button variant="danger-ghost" size="icon-sm" aria-label={`Variant ${i + 1}-i sil`} disabled={options.length <= 2} onClick={() => removeOption(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
        {options.length < 4 && (
          <Button variant="soft" size="sm" className="mt-2" onClick={() => onChange({ ...q, options: [...options, ""] })}>
            <Plus className="h-4 w-4" aria-hidden /> Variant əlavə et
          </Button>
        )}
        <p className="mt-1.5 text-xs text-muted">2–4 variant. Düzgün cavabı dairə ilə işarələyin.</p>
      </fieldset>
      <TextField label="İzah (cavabdan sonra görünür)" multiline rows={2} value={q.explanation} onChange={(explanation) => onChange({ ...q, explanation })} />
    </div>
  );
}

export function QuizEditor({ value, onChange }: EditorProps<QuizContent>) {
  return (
    <ListEditor
      label="Suallar"
      items={value.questions}
      onChange={(questions) => onChange({ ...value, questions })}
      create={() => ({ id: uid("q"), text: "", options: ["", ""], correctIndex: 0, explanation: "" })}
      getKey={(q) => q.id}
      min={1}
      itemLabel={(i) => `Sual ${i + 1}`}
      addLabel="Sual əlavə et"
      render={(q, update, i) => <QuestionEditor q={q} index={i} onChange={update} />}
    />
  );
}

// ── Ordering ───────────────────────────────────────────────────

export function OrderingEditor({ value, onChange }: EditorProps<OrderingContent>) {
  return (
    <div className="space-y-4">
      <TextField label="Təlimat" value={value.instructions} onChange={(instructions) => onChange({ ...value, instructions })} />
      <StringListEditor
        label="Elementlər — düzgün ardıcıllıqla yazın"
        items={value.items}
        onChange={(items) => onChange({ ...value, items })}
        min={2}
        itemLabel={(i) => `Mövqe ${i + 1}`}
        addLabel="Element əlavə et"
      />
      <p className="-mt-2 text-xs text-muted">Tələbə elementləri qarışıq görür. Elementlər təkrarlanmamalıdır.</p>
      <TextField label="İzah (istəyə bağlı)" multiline rows={2} value={value.explanation} onChange={(explanation) => onChange({ ...value, explanation })} />
    </div>
  );
}

// ── Categorize ─────────────────────────────────────────────────

export function CategorizeEditor({ value, onChange }: EditorProps<CategorizeContent>) {
  const categories = Array.isArray(value.categories) ? value.categories : [];
  const items = Array.isArray(value.items) ? value.items : [];

  const setCategories = (next: CategorizeContent["categories"]) => {
    // Items pointing at a removed category move to the first remaining one.
    const ids = new Set(next.map((c) => c.id));
    const fallback = next[0]?.id ?? "";
    onChange({ ...value, categories: next, items: items.map((it) => (ids.has(it.categoryId) ? it : { ...it, categoryId: fallback })) });
  };

  return (
    <div className="space-y-5">
      <TextField label="Təlimat" value={value.instructions} onChange={(instructions) => onChange({ ...value, instructions })} />
      <ListEditor
        label="Kateqoriyalar"
        items={categories}
        onChange={setCategories}
        create={() => ({ id: uid("k"), label: "" })}
        getKey={(c) => c.id}
        min={2}
        itemLabel={(i) => `Kateqoriya ${i + 1}`}
        addLabel="Kateqoriya əlavə et"
        render={(c, update, i) => <Input aria-label={`Kateqoriya ${i + 1} adı`} value={c.label} onChange={(e) => update({ ...c, label: e.target.value })} />}
      />
      <ListEditor
        label="Elementlər"
        items={items}
        onChange={(next) => onChange({ ...value, items: next })}
        create={() => ({ id: uid("i"), text: "", categoryId: categories[0]?.id ?? "" })}
        getKey={(it) => it.id}
        min={2}
        itemLabel={(i) => `Element ${i + 1}`}
        addLabel="Element əlavə et"
        render={(it, update, i) => (
          <div className="grid gap-2 sm:grid-cols-[1fr_14rem]">
            <Input aria-label={`Element ${i + 1} mətni`} value={it.text} onChange={(e) => update({ ...it, text: e.target.value })} />
            <Select
              aria-label={`Element ${i + 1} kateqoriyası`}
              value={it.categoryId}
              onValueChange={(categoryId) => update({ ...it, categoryId })}
              options={categories.map((c, ci) => ({ value: c.id, label: c.label || `Kateqoriya ${ci + 1}` }))}
              placeholder="Kateqoriya seçin"
            />
          </div>
        )}
      />
      <TextField label="İzah (istəyə bağlı)" multiline rows={2} value={value.explanation} onChange={(explanation) => onChange({ ...value, explanation })} />
    </div>
  );
}

// ── Bug hunt ───────────────────────────────────────────────────

export function BugHuntEditor({ value, onChange }: EditorProps<BugHuntContent>) {
  const group = useId();
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Ssenari</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(BUG_HUNT_SCENARIOS) as BugHuntScenario[]).map((key) => {
            const s = BUG_HUNT_SCENARIOS[key];
            const active = value.scenario === key;
            return (
              <label
                key={key}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-iris",
                  active ? "border-iris bg-iris-soft" : "border-line hover:border-line-strong"
                )}
              >
                <input type="radio" name={group} value={key} checked={active} onChange={() => onChange({ ...value, scenario: key })} className="sr-only" />
                <span className="font-semibold text-ink">{s.title}</span>
                <span className="text-xs text-muted">{s.bugs.length} baq · {s.requirements.length} tələb</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <details className="rounded-lg border border-line bg-surface-2/50 p-3 text-sm">
        <summary className="cursor-pointer font-medium text-ink-2">Bu ssenaridəki baqlar</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
          {BUG_HUNT_SCENARIOS[value.scenario]?.bugs.map((b) => <li key={b.id}>{b.title}</li>)}
        </ul>
      </details>
      <TextField label="Təlimat" multiline rows={2} value={value.instructions} onChange={(instructions) => onChange({ ...value, instructions })} />
    </div>
  );
}

// ── Task ───────────────────────────────────────────────────────

export function TaskEditor({ value, onChange }: EditorProps<TaskContent>) {
  return (
    <div className="space-y-4">
      <TextField label="Tapşırığın şərti" required multiline rows={4} value={value.instructions} onChange={(instructions) => onChange({ ...value, instructions })} />
      <TextField label="Cavab sahəsində ipucu" value={value.placeholder} onChange={(placeholder) => onChange({ ...value, placeholder })} />
      <Switch
        label="Məcburi tapşırıq"
        hint="Tələbəyə bu tapşırığın məcburi olduğu göstərilir."
        checked={value.required ?? false}
        onCheckedChange={(required) => onChange({ ...value, required })}
      />
    </div>
  );
}

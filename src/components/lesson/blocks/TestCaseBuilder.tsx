"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ClipboardList, Eye, EyeOff, FileText, ListChecks, Plus, Trash2 } from "lucide-react";
import type { TestCaseBuilderContent } from "@/types/blocks";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { RichText } from "@/components/lesson/RichText";
import { BlockShell, Feedback, InlineError, useAttempt, type InteractiveProps } from "@/components/lesson/shared";

/* ------------------------------------------------------------------ */
/* Shared steps editor (also used by BugReportBuilder)                 */
/* ------------------------------------------------------------------ */

export type StepRow = { id: string; text: string };

let stepSeq = 0;
export function makeStepRows(texts: string[], min: number): StepRow[] {
  const rows = texts.map((text) => ({ id: `s${++stepSeq}`, text }));
  while (rows.length < min) rows.push({ id: `s${++stepSeq}`, text: "" });
  return rows;
}

export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Numbered, reorderable list of steps — keyboard and touch friendly. */
export function StepsEditor({
  legend, hint, rows, onChange, placeholder, minRows = 1, columnLabel = "Addım",
}: {
  legend: string;
  hint?: string;
  rows: StepRow[];
  onChange: (rows: StepRow[]) => void;
  placeholder?: (index: number) => string;
  minRows?: number;
  columnLabel?: string;
}) {
  const hintId = useId();
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [announce, setAnnounce] = useState("");

  const focusRow = (id: string) => requestAnimationFrame(() => inputs.current.get(id)?.focus());

  function add(afterIndex = rows.length - 1) {
    const [row] = makeStepRows([""], 1);
    const next = [...rows];
    next.splice(afterIndex + 1, 0, row);
    onChange(next);
    setAnnounce(`Addım ${afterIndex + 2} əlavə olundu`);
    focusRow(row.id);
  }

  function remove(index: number) {
    if (rows.length <= 1) return;
    const next = rows.filter((_, i) => i !== index);
    onChange(next);
    setAnnounce(`Addım ${index + 1} silindi`);
    focusRow(next[Math.max(0, index - 1)].id);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setAnnounce(`Addım ${index + 1} ${target + 1}-ci yerə köçürüldü`);
    focusRow(next[target].id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      add(index);
    } else if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      move(index, -1);
    } else if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      move(index, 1);
    } else if (e.key === "Backspace" && rows[index].text === "" && rows.length > Math.max(1, minRows)) {
      e.preventDefault();
      remove(index);
    }
  }

  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-ink-2">{legend}</legend>
      {hint && <p id={hintId} className="mb-2 text-xs text-muted">{hint}</p>}
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="hidden grid-cols-[3rem_1fr_auto] border-b border-line bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid" aria-hidden>
          <span className="px-3 py-2 text-center">#</span>
          <span className="px-1 py-2">{columnLabel}</span>
          <span className="px-3 py-2 text-right">Əməliyyat</span>
        </div>
        <ol className="divide-y divide-line">
          {rows.map((row, i) => (
            <li key={row.id} className="grid grid-cols-[2.5rem_1fr] items-center gap-x-1 gap-y-1 bg-surface px-1.5 py-1.5 sm:grid-cols-[3rem_1fr_auto] sm:px-0">
              <span className="flex h-11 items-center justify-center font-mono text-sm font-semibold text-iris" aria-hidden>
                {i + 1}
              </span>
              <Input
                ref={(el) => {
                  if (el) inputs.current.set(row.id, el);
                  else inputs.current.delete(row.id);
                }}
                value={row.text}
                onChange={(e) => onChange(rows.map((r) => (r.id === row.id ? { ...r, text: e.target.value } : r)))}
                onKeyDown={(e) => onKeyDown(e, i)}
                aria-label={`${columnLabel} ${i + 1}`}
                placeholder={placeholder?.(i) ?? `${columnLabel} ${i + 1}`}
                className="h-11 border-transparent bg-transparent hover:border-line focus:bg-surface"
              />
              <div className="col-start-2 flex justify-end gap-0.5 sm:col-start-auto sm:pr-1.5">
                <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={`Addım ${i + 1}-i yuxarı köçür`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={`Addım ${i + 1}-i aşağı köçür`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </Button>
                <Button variant="danger-ghost" size="icon" className="h-11 w-11" aria-label={`Addım ${i + 1}-i sil`} disabled={rows.length <= 1} onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-line bg-surface-2/50 p-1.5">
          <Button variant="ghost" size="md" className="w-full justify-start text-iris hover:text-iris" onClick={() => add()}>
            <Plus className="h-4 w-4" aria-hidden /> Addım əlavə et
          </Button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </fieldset>
  );
}

/** Read-only steps table used for sample solutions. */
export function StepsTable({ steps, columnLabel = "Addım" }: { steps: string[]; columnLabel?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="w-12 px-3 py-2 text-center font-semibold">#</th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">{columnLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {steps.map((s, i) => (
            <tr key={i} className="bg-surface">
              <td className="px-3 py-2.5 text-center font-mono font-semibold text-iris">{i + 1}</td>
              <td className="px-3 py-2.5 text-ink">{s}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SampleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted sm:pt-0.5">{label}</dt>
      <dd className="text-sm leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Test case builder                                                    */
/* ------------------------------------------------------------------ */

export default function TestCaseBuilder(props: InteractiveProps<TestCaseBuilderContent>) {
  const { content, title } = props;
  const { result, pending, error, submit } = useAttempt(props);
  const prev = props.initial?.answer ?? {};
  const minSteps = Math.max(1, content.minSteps || 1);

  const [tcTitle, setTcTitle] = useState(asString(prev.title));
  const [preconditions, setPreconditions] = useState(asString(prev.preconditions));
  const [steps, setSteps] = useState<StepRow[]>(() => makeStepRows(asStringArray(prev.steps), minSteps));
  const [expected, setExpected] = useState(asString(prev.expected));
  const [showSample, setShowSample] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const sampleId = useId();

  const filledSteps = steps.filter((s) => s.text.trim()).length;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tcTitle.trim() && !expected.trim() && filledSteps === 0) {
      setLocalError("Yoxlamadan əvvəl test case-i doldurun.");
      return;
    }
    setLocalError(null);
    await submit({
      title: tcTitle,
      preconditions,
      steps: steps.map((s) => s.text.trim()).filter(Boolean),
      expected,
    });
  }

  const sample = content.sampleSolution;

  return (
    <BlockShell type={props.type} title={title} passed={result?.passed}>
      {/* Requirement ticket */}
      <article className="rounded-lg border border-line bg-surface-2/60" aria-labelledby={`${sampleId}-feat`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-soft px-2 py-0.5 font-mono text-xs font-semibold text-sky">
            <FileText className="h-3.5 w-3.5" aria-hidden /> REQ
          </span>
          <span className="text-xs font-medium text-muted">Tələb</span>
        </div>
        <div className="px-4 py-3">
          <h4 id={`${sampleId}-feat`} className="text-base font-semibold text-ink">{content.feature}</h4>
          <RichText text={content.requirement} className="mt-1.5 text-sm text-ink-2" />
        </div>
      </article>

      {/* Test case form */}
      <form onSubmit={onSubmit} noValidate className="mt-5 overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-iris" aria-hidden />
            <span className="font-mono text-xs font-semibold text-iris">TC-001</span>
            <span className="text-sm font-semibold text-ink">Yeni test case</span>
          </div>
          <span className="text-xs text-muted">
            {filledSteps}/{minSteps} addım
          </span>
        </div>

        <div className="grid gap-5 p-4">
          <Field label="Başlıq (Title)" hint="Nəyi yoxladığınızı bir cümlədə yazın.">
            {(f) => (
              <Input {...f} value={tcTitle} onChange={(e) => setTcTitle(e.target.value)} placeholder="Məs.: Etibarlı promo kod səbətə endirim tətbiq edir" />
            )}
          </Field>

          <Field label="İlkin şərtlər (Preconditions)" hint="Testə başlamazdan əvvəl nə hazır olmalıdır?">
            {(f) => (
              <Textarea {...f} value={preconditions} onChange={(e) => setPreconditions(e.target.value)} className="min-h-20" placeholder="Məs.: İstifadəçi daxil olub; səbətdə məhsul var" />
            )}
          </Field>

          <StepsEditor
            legend="Addımlar (Steps)"
            hint={`Ən az ${minSteps} addım. Enter — yeni addım, Alt + ↑/↓ — yerini dəyiş.`}
            rows={steps}
            onChange={setSteps}
            minRows={minSteps}
            placeholder={(i) => (i === 0 ? "Məs.: Səbət səhifəsini aç" : `Addım ${i + 1}`)}
          />

          <Field label="Gözlənilən nəticə (Expected result)" hint="Test keçirsə, nə görməliyik? Konkret dəyərlər yazın.">
            {(f) => (
              <Textarea {...f} value={expected} onChange={(e) => setExpected(e.target.value)} className="min-h-20" placeholder="Məs.: Cəm 36 AZN olur və təsdiq mesajı görünür" />
            )}
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface-2/40 px-4 py-3">
          <Button type="submit" loading={pending}>
            <ListChecks className="h-4 w-4" aria-hidden /> {result ? "Yenidən yoxla" : "Yoxla"}
          </Button>
          {result && (
            <Button
              variant="secondary"
              aria-expanded={showSample}
              aria-controls={`${sampleId}-sample`}
              onClick={() => setShowSample((v) => !v)}
            >
              {showSample ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {showSample ? "Nümunə həllini gizlət" : "Nümunə həlli göstər"}
            </Button>
          )}
        </div>
      </form>

      <InlineError message={localError ?? error} />
      {result && <Feedback result={result} successText="Əla test case!" failText="Test case-i bir az da gücləndir" />}

      {result && showSample && (
        <section id={`${sampleId}-sample`} aria-label="Nümunə həll" className="mt-4 overflow-hidden rounded-lg border border-iris/30 animate-pop-in">
          <div className="flex items-center gap-2 border-b border-iris/20 bg-iris-soft px-4 py-2.5">
            <ClipboardList className="h-4 w-4 text-iris-ink" aria-hidden />
            <span className="text-sm font-semibold text-iris-ink">Nümunə həll</span>
          </div>
          <dl className="grid gap-4 p-4">
            <SampleRow label="Başlıq">{sample.title}</SampleRow>
            <SampleRow label="İlkin şərtlər">{sample.preconditions || "—"}</SampleRow>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted sm:pt-2">Addımlar</dt>
              <dd><StepsTable steps={sample.steps} /></dd>
            </div>
            <SampleRow label="Gözlənilən nəticə">{sample.expected}</SampleRow>
          </dl>
        </section>
      )}
    </BlockShell>
  );
}


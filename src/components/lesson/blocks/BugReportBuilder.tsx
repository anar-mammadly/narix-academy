"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bug, CheckCircle2, Eye, EyeOff, ListChecks, ScanEye, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BugReportBuilderContent, Priority, Severity } from "@/types/blocks";
import { Badge, Button, Field, Input, Textarea } from "@/components/ui";
import { RichText } from "@/components/lesson/RichText";
import { BlockShell, Feedback, InlineError, useAttempt, type InteractiveProps } from "@/components/lesson/shared";
import { SampleRow, StepsEditor, StepsTable, asString, asStringArray, makeStepRows, type StepRow } from "./TestCaseBuilder";

const TITLE_MIN = 10;
const TITLE_MAX = 90;

type Option<T extends string> = { value: T; label: string; description: string; dot: string };

const SEVERITIES: Option<Severity>[] = [
  { value: "Critical", label: "Critical", description: "Sistem/əsas funksiya işləmir, pul və ya data itir", dot: "bg-bug" },
  { value: "Major", label: "Major", description: "Vacib funksiya pozulub, çətin yolla davam etmək olur", dot: "bg-flame" },
  { value: "Minor", label: "Minor", description: "Kiçik funksional problem, asan workaround var", dot: "bg-xp" },
  { value: "Trivial", label: "Trivial", description: "Kosmetik: mətn, rəng, düzülüş", dot: "bg-sky" },
];

const PRIORITIES: Option<Priority>[] = [
  { value: "High", label: "High", description: "Dərhal düzəldilməlidir", dot: "bg-bug" },
  { value: "Medium", label: "Medium", description: "Növbəti relizdə", dot: "bg-xp" },
  { value: "Low", label: "Low", description: "Vaxt olanda", dot: "bg-sky" },
];

function isSeverity(v: unknown): v is Severity {
  return SEVERITIES.some((s) => s.value === v);
}
function isPriority(v: unknown): v is Priority {
  return PRIORITIES.some((p) => p.value === v);
}

/** Segmented single-choice control with radio semantics and arrow-key navigation. */
function Segmented<T extends string>({
  legend, options, value, onChange, cols,
}: {
  legend: string;
  options: Option<T>[];
  value: T | null;
  onChange: (v: T) => void;
  cols: string;
}) {
  const legendId = useId();
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (i + keys[e.key] + options.length) % options.length;
    onChange(options[next].value);
    const group = e.currentTarget.parentElement;
    requestAnimationFrame(() => (group?.children[next] as HTMLElement | undefined)?.focus());
  }

  return (
    <fieldset>
      <legend id={legendId} className="mb-1.5 text-sm font-medium text-ink-2">{legend}</legend>
      <div role="radiogroup" aria-labelledby={legendId} className={cn("grid gap-1.5 rounded-lg bg-surface-2 p-1.5", cols)}>
        {options.map((o, i) => {
          const checked = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={i === activeIndex ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              title={o.description}
              className={cn(
                "flex min-h-11 flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-iris/20",
                checked ? "border-iris bg-surface text-ink shadow-pop" : "border-transparent text-ink-2 hover:bg-surface/70"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", o.dot)} aria-hidden />
                {o.label}
                {checked && <CheckCircle2 className="h-4 w-4 text-iris" aria-hidden />}
              </span>
              <span className="text-xs leading-snug text-muted">{o.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function BugReportBuilder(props: InteractiveProps<BugReportBuilderContent>) {
  const { content, title } = props;
  const { result, pending, error, submit } = useAttempt(props);
  const prev = props.initial?.answer ?? {};
  const ids = useId();

  const [bugTitle, setBugTitle] = useState(asString(prev.title));
  const [steps, setSteps] = useState<StepRow[]>(() => makeStepRows(asStringArray(prev.steps), 3));
  const [expected, setExpected] = useState(asString(prev.expected));
  const [actual, setActual] = useState(asString(prev.actual));
  const [severity, setSeverity] = useState<Severity | null>(isSeverity(prev.severity) ? prev.severity : null);
  const [priority, setPriority] = useState<Priority | null>(isPriority(prev.priority) ? prev.priority : null);
  const [showSample, setShowSample] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ severity: Severity | null; priority: Priority | null } | null>(
    props.initial ? { severity: isSeverity(prev.severity) ? prev.severity : null, priority: isPriority(prev.priority) ? prev.priority : null } : null
  );

  const len = bugTitle.trim().length;
  const titleState = len === 0 ? "empty" : len < TITLE_MIN ? "short" : len > TITLE_MAX ? "long" : "ok";
  const titleHint =
    titleState === "short" ? `Ən az ${TITLE_MIN} simvol` : titleState === "long" ? `Çox uzundur — ${TITLE_MAX} simvola qədər qısaldın` : titleState === "ok" ? "Uzunluq uyğundur" : `${TITLE_MIN}–${TITLE_MAX} simvol: harada + nə baş verir`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!severity || !priority) {
      setLocalError("Severity və Priority seçin.");
      return;
    }
    setLocalError(null);
    const grade = await submit({
      title: bugTitle,
      steps: steps.map((s) => s.text.trim()).filter(Boolean),
      expected,
      actual,
      severity,
      priority,
    });
    if (grade) setSubmitted({ severity, priority });
  }

  const sample = content.sampleSolution;
  const sevOk = submitted?.severity === content.expectedSeverity;
  const priOk = submitted?.priority === content.expectedPriority;

  return (
    <BlockShell type={props.type} title={title} passed={result?.passed}>
      {/* Observation */}
      <aside aria-labelledby={`${ids}-obs`} className="rounded-lg border border-xp/30 bg-xp-soft/60 px-4 py-3">
        <h4 id={`${ids}-obs`} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-xp">
          <ScanEye className="h-4 w-4" aria-hidden /> Müşahidə
        </h4>
        <RichText text={content.scenario} className="mt-1.5 text-sm text-ink" />
      </aside>

      {/* Jira-like form */}
      <form onSubmit={onSubmit} noValidate className="mt-5 overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/60 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-bug px-1.5 py-0.5 text-xs font-semibold text-white">
            <Bug className="h-3.5 w-3.5" aria-hidden /> Bug
          </span>
          <span className="font-mono text-xs font-semibold text-muted">NRX-???</span>
          <span className="text-sm font-semibold text-ink">Yeni bug report</span>
        </div>

        <div className="grid gap-5 p-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label htmlFor={`${ids}-title`} className="text-sm font-medium text-ink-2">Başlıq (Summary)</label>
              <span
                className={cn("font-mono text-xs tabular-nums", titleState === "ok" ? "text-pass" : titleState === "empty" ? "text-muted" : "text-bug")}
                aria-hidden
              >
                {len}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id={`${ids}-title`}
              value={bugTitle}
              onChange={(e) => setBugTitle(e.target.value)}
              aria-describedby={`${ids}-title-hint`}
              aria-invalid={titleState === "short" || titleState === "long" ? true : undefined}
              placeholder="Məs.: Checkout: ödənişdən sonra sifariş yaranmır"
            />
            <p id={`${ids}-title-hint`} className={cn("mt-1.5 flex items-center gap-1.5 text-sm", titleState === "ok" ? "text-pass" : titleState === "empty" ? "text-muted" : "text-bug")} aria-live="polite">
              {titleState === "ok" && <CheckCircle2 className="h-4 w-4" aria-hidden />}
              {(titleState === "short" || titleState === "long") && <XCircle className="h-4 w-4" aria-hidden />}
              <span>
                {titleHint}
                <span className="sr-only"> ({len} simvol)</span>
              </span>
            </p>
          </div>

          <StepsEditor
            legend="Təkrarlama addımları (Steps to reproduce)"
            hint="Ən az 2 addım. Başqası bu addımlarla bug-ı təkrarlaya bilməlidir."
            rows={steps}
            onChange={setSteps}
            minRows={2}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Gözlənilən nəticə (Expected)">
              {(f) => <Textarea {...f} value={expected} onChange={(e) => setExpected(e.target.value)} className="min-h-24" placeholder="Nə baş verməli idi?" />}
            </Field>
            <Field label="Faktiki nəticə (Actual)">
              {(f) => <Textarea {...f} value={actual} onChange={(e) => setActual(e.target.value)} className="min-h-24" placeholder="Əslində nə baş verdi?" />}
            </Field>
          </div>

          <Segmented legend="Severity — təsirin ciddiliyi" options={SEVERITIES} value={severity} onChange={setSeverity} cols="grid-cols-2 lg:grid-cols-4" />
          <Segmented legend="Priority — düzəltmə təcili" options={PRIORITIES} value={priority} onChange={setPriority} cols="grid-cols-1 sm:grid-cols-3" />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface-2/40 px-4 py-3">
          <Button type="submit" loading={pending}>
            <ListChecks className="h-4 w-4" aria-hidden /> {result ? "Yenidən yoxla" : "Bug report-u göndər"}
          </Button>
          {result && (
            <Button variant="secondary" aria-expanded={showSample} aria-controls={`${ids}-sample`} onClick={() => setShowSample((v) => !v)}>
              {showSample ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {showSample ? "Nümunə həllini gizlət" : "Nümunə həlli göstər"}
            </Button>
          )}
        </div>
      </form>

      <InlineError message={localError ?? error} />
      {result && <Feedback result={result} successText="Əla bug report!" failText="Bug report-u bir az da gücləndir" />}

      {result && showSample && (
        <section id={`${ids}-sample`} aria-label="Nümunə həll" className="mt-4 overflow-hidden rounded-lg border border-iris/30 animate-pop-in">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-iris/20 bg-iris-soft px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-iris-ink">
              <Bug className="h-4 w-4" aria-hidden /> Nümunə həll
            </span>
            <span className="text-sm font-semibold text-iris-ink">
              Gözlənilən: {content.expectedSeverity} / {content.expectedPriority}
            </span>
          </div>
          <dl className="grid gap-4 p-4">
            <SampleRow label="Başlıq">{sample.title}</SampleRow>
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted sm:pt-2">Addımlar</dt>
              <dd><StepsTable steps={sample.steps} /></dd>
            </div>
            <SampleRow label="Expected">{sample.expected}</SampleRow>
            <SampleRow label="Actual">{sample.actual}</SampleRow>
            <SampleRow label="Severity / Priority">
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone={sevOk ? "pass" : "bug"}>
                  {sevOk ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <XCircle className="h-3.5 w-3.5" aria-hidden />}
                  Severity: {content.expectedSeverity}
                </Badge>
                <Badge tone={priOk ? "pass" : "bug"}>
                  {priOk ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <XCircle className="h-3.5 w-3.5" aria-hidden />}
                  Priority: {content.expectedPriority}
                </Badge>
                {submitted && (
                  <span className="text-xs text-muted">
                    Sizin seçim: {submitted.severity ?? "—"} / {submitted.priority ?? "—"}
                  </span>
                )}
              </span>
              <span className="mt-2 block text-xs text-muted">
                Severity bug-ın sistemə təsirini, Priority isə nə qədər tez düzəldilməli olduğunu göstərir — onlar fərqli ola bilər.
              </span>
            </SampleRow>
          </dl>
        </section>
      )}
    </BlockShell>
  );
}

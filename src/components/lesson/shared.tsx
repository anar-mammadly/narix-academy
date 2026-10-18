"use client";

// Shared building blocks for interactive lesson blocks.
//
// Every interactive block component receives InteractiveProps and calls
// `submit(answer)` from useAttempt. In preview mode grading runs locally;
// otherwise /api/blocks/attempt grades it, stores it and pays XP. The hook
// also reports the reward to the lesson player (XP toast, confetti, level up).

import { createContext, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { gradeBlock, type GradeResult } from "@/lib/grading";
import type { Reward } from "@/lib/game";
import type { BlockType } from "@/types/blocks";

export type AttemptState = { score: number; passed: boolean; answer: Record<string, unknown> } | null;

export type InteractiveProps<C> = {
  blockId: string;
  type: BlockType;
  title?: string | null;
  content: C;
  initial: AttemptState;
};

type PlayerContextValue = {
  previewMode: boolean;
  passMark: number;
  onReward: (r: Reward) => void;
  onGraded: (blockId: string, g: GradeResult) => void;
};

export const PlayerContext = createContext<PlayerContextValue>({
  previewMode: true,
  passMark: 70,
  onReward: () => {},
  onGraded: () => {},
});

export function useAttempt<C>(props: InteractiveProps<C>) {
  const ctx = useContext(PlayerContext);
  const [result, setResult] = useState<GradeResult | null>(
    props.initial ? { score: props.initial.score, passed: props.initial.passed } : null
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(answer: Record<string, unknown>): Promise<GradeResult | null> {
    setPending(true);
    setError(null);
    try {
      let grade: GradeResult | null;
      if (ctx.previewMode) {
        grade = gradeBlock(props.type, props.content, answer, ctx.passMark);
      } else {
        const res = await fetch("/api/blocks/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId: props.blockId, answer }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Cavab yadda saxlanmadı");
        grade = data.grade;
        if (data.reward) ctx.onReward(data.reward);
      }
      setResult(grade);
      if (grade) ctx.onGraded(props.blockId, grade);
      return grade;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi. Yenidən cəhd et.");
      return null;
    } finally {
      setPending(false);
    }
  }

  return { result, pending, error, submit, reset: () => setResult(null), passMark: ctx.passMark };
}

const kindLabel: Partial<Record<BlockType, string>> = {
  QUIZ: "Yoxlama",
  ORDERING: "Sırala",
  CATEGORIZE: "Qruplaşdır",
  CODE_EXERCISE: "Kod tapşırığı",
  BUG_HUNT: "Bug Hunt",
  TEST_CASE_BUILDER: "Test case yaz",
  BUG_REPORT_BUILDER: "Bug report yaz",
  API_PLAYGROUND: "API Playground",
  TASK: "Tapşırıq",
};

/** Frame for interactive blocks: tinted header with kind + optional status. */
export function BlockShell({
  type, title, passed, children, className, wide,
}: { type: BlockType; title?: string | null; passed?: boolean; children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <section
      aria-label={title ?? kindLabel[type]}
      className={cn(
        "overflow-clip rounded-xl border bg-surface",
        passed ? "border-pass/40" : "border-line",
        wide && "lg:-mx-16",
        className
      )}
    >
      <header className={cn("flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5", passed ? "border-pass/25 bg-pass-soft/60" : "border-line bg-surface-2/60")}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 rounded-md bg-iris px-2 py-0.5 text-xs font-semibold text-white">{kindLabel[type] ?? "Interaktiv"}</span>
          {title && <h3 className="truncate text-sm font-semibold text-ink">{title}</h3>}
        </div>
        {passed && (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-pass">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Keçdin
          </span>
        )}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

/** Result banner shown after checking. Never colour-only: icon + text. */
export function Feedback({
  result, explanation, onRetry, successText, failText,
}: { result: GradeResult; explanation?: ReactNode; onRetry?: () => void; successText?: string; failText?: string }) {
  const ok = result.passed;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-4 rounded-lg border p-4 animate-pop-in",
        ok ? "border-pass/30 bg-pass-soft" : "border-bug/30 bg-bug-soft"
      )}
    >
      <div className="flex items-start gap-3">
        {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pass" aria-hidden /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-bug" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold", ok ? "text-pass" : "text-bug")}>
            {ok ? successText ?? "Düzdür!" : failText ?? "Hələ tam düz deyil"}
            <span className="ml-2 font-normal text-ink-2">{result.score}%</span>
          </p>
          {result.checks && (
            <ul className="mt-2 grid gap-1 text-sm">
              {result.checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-ink-2">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 text-pass" aria-label="Keçdi" /> : <XCircle className="h-4 w-4 text-bug" aria-label="Keçmədi" />}
                  {c.label}
                </li>
              ))}
            </ul>
          )}
          {explanation && <div className="mt-2 text-sm leading-relaxed text-ink-2">{explanation}</div>}
        </div>
        {onRetry && (
          <button onClick={onRetry} className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-ink-2 hover:bg-surface/70">
            <RotateCcw className="h-4 w-4" aria-hidden /> Yenidən
          </button>
        )}
      </div>
    </div>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p role="alert" className="mt-3 text-sm text-bug">{message}</p>;
}

export function HintList({ hints }: { hints?: string[] }) {
  const [shown, setShown] = useState(0);
  if (!hints?.length) return null;
  return (
    <div className="mt-3">
      {hints.slice(0, shown).map((h, i) => (
        <p key={i} className="mb-2 flex gap-2 rounded-md bg-xp-soft px-3 py-2 text-sm text-ink-2 animate-pop-in">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-xp" aria-hidden /> {h}
        </p>
      ))}
      {shown < hints.length && (
        <button onClick={() => setShown(shown + 1)} className="text-sm font-medium text-iris hover:underline">
          {shown === 0 ? "İpucu göstər" : "Növbəti ipucu"} ({shown + 1}/{hints.length})
        </button>
      )}
    </div>
  );
}

/** Deterministic shuffle so server and client render the same order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

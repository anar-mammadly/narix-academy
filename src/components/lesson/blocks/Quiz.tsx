"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressBar";
import { BlockShell, InlineError, useAttempt, type InteractiveProps } from "../shared";
import { renderInline } from "../RichText";
import type { QuizContent } from "@/types/blocks";

const LETTERS = ["A", "B", "C", "D"];

/**
 * One question at a time: pick → check → see why → next.
 * The whole answer set is graded on the server at the end.
 */
export default function Quiz(props: InteractiveProps<QuizContent>) {
  const questions = useMemo(() => props.content.questions ?? [], [props.content.questions]);
  const { result, pending, error, submit, reset, passMark } = useAttempt(props);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(
    (props.initial?.answer?.answers as Record<string, number>) ?? {}
  );
  const [checked, setChecked] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const q = questions[index];
  const selected = q ? answers[q.id] : undefined;
  const isLast = index === questions.length - 1;
  const finished = result != null;

  // Number keys pick an option, Enter checks / continues.
  useEffect(() => {
    if (finished || !q) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest?.(`[data-quiz="${props.blockId}"]`)) return;
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= q.options.length) setAnswers((a) => ({ ...a, [q.id]: n - 1 }));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, checked, finished, props.blockId]);

  if (!questions.length) return null;

  async function next() {
    if (!checked) { setChecked(true); return; }
    if (isLast) {
      await submit({ answers });
      return;
    }
    setChecked(false);
    setIndex(index + 1);
  }

  function restart() {
    reset();
    setAnswers({});
    setIndex(0);
    setChecked(false);
    setShowReview(false);
  }

  if (finished) {
    const correct = questions.filter((qq) => answers[qq.id] === qq.correctIndex).length;
    const hasAnswers = Object.keys(answers).length > 0;
    return (
      <BlockShell type="QUIZ" title={props.title ?? "Yekun yoxlama"} passed={result.passed}>
        <div className="flex flex-col items-center gap-4 py-2 text-center sm:flex-row sm:text-left" role="status" aria-live="polite">
          <ProgressRing value={result.score} size={92} stroke={9} tone={result.passed ? "pass" : "flame"} label="Nəticə">
            <span className="font-display text-xl font-semibold text-ink">{result.score}%</span>
          </ProgressRing>
          <div className="flex-1">
            <p className={cn("flex items-center justify-center gap-2 font-display text-lg font-semibold sm:justify-start", result.passed ? "text-pass" : "text-flame")}>
              {result.passed ? <Trophy className="h-5 w-5" aria-hidden /> : <RotateCcw className="h-5 w-5" aria-hidden />}
              {result.passed ? "Əla nəticə!" : "Bir az da məşq"}
            </p>
            <p className="mt-1 text-ink-2">
              {hasAnswers ? `${questions.length} sualdan ${correct} düz. ` : ""}
              {result.passed ? "Səhv cavabların “Təkrar” bölməsinə düşdü." : `Keçid balı ${passMark}%. İzahları oxu və yenidən cəhd et.`}
            </p>
          </div>
          <div className="flex gap-2">
            {hasAnswers && <Button variant="secondary" onClick={() => setShowReview(!showReview)}>{showReview ? "Gizlət" : "Cavablara bax"}</Button>}
            <Button variant={result.passed ? "ghost" : "primary"} onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden /> Yenidən</Button>
          </div>
        </div>
        {showReview && (
          <ol className="mt-5 grid gap-3 border-t border-line pt-5">
            {questions.map((qq, i) => {
              const ok = answers[qq.id] === qq.correctIndex;
              return (
                <li key={qq.id} className="rounded-lg border border-line p-4">
                  <p className="flex gap-2 font-medium text-ink">
                    {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pass" aria-label="Düz" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-bug" aria-label="Səhv" />}
                    <span>{i + 1}. {renderInline(qq.text)}</span>
                  </p>
                  <p className="mt-2 pl-7 text-sm text-ink-2">
                    <strong className="text-pass">Düzgün cavab:</strong> {renderInline(qq.options[qq.correctIndex])}
                  </p>
                  {qq.explanation && <p className="mt-1 pl-7 text-sm text-muted">{renderInline(qq.explanation)}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </BlockShell>
    );
  }

  const isCorrect = selected === q.correctIndex;

  return (
    <BlockShell type="QUIZ" title={props.title}>
      <div data-quiz={props.blockId}>
        {questions.length > 1 && (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden>
              {questions.map((qq, i) => (
                <span
                  key={qq.id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < index ? (answers[qq.id] === qq.correctIndex ? "bg-pass-bright" : "bg-bug-bright") : i === index ? "bg-iris" : "bg-surface-3"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium tabular-nums text-muted">{index + 1}/{questions.length}</span>
          </div>
        )}

        <fieldset>
          <legend className="mb-4 text-[1.05rem] font-semibold leading-snug text-ink">{renderInline(q.text)}</legend>
          {q.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.imageUrl} alt="" className="mb-4 max-h-64 rounded-lg border border-line" />
          )}
          <div className="grid gap-2.5">
            {q.options.map((opt, i) => {
              const picked = selected === i;
              const showRight = checked && i === q.correctIndex;
              const showWrong = checked && picked && !isCorrect;
              return (
                <label
                  key={i}
                  className={cn(
                    "group flex min-h-13 cursor-pointer items-center gap-3 rounded-lg border-2 px-3.5 py-3 transition-colors",
                    checked && "cursor-default",
                    showRight ? "border-pass bg-pass-soft" : showWrong ? "border-bug bg-bug-soft animate-shake" : picked ? "border-iris bg-iris-soft" : "border-line hover:border-line-strong hover:bg-surface-2"
                  )}
                >
                  <input
                    type="radio"
                    name={`quiz-${props.blockId}-${q.id}`}
                    className="sr-only"
                    checked={picked}
                    disabled={checked}
                    onChange={() => setAnswers({ ...answers, [q.id]: i })}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-md border text-sm font-semibold",
                      showRight ? "border-pass bg-pass-bright text-[#06281c]" : showWrong ? "border-bug bg-bug text-white" : picked ? "border-iris bg-iris text-white" : "border-line-strong text-muted"
                    )}
                  >
                    {showRight ? <CheckCircle2 className="h-4 w-4" /> : showWrong ? <XCircle className="h-4 w-4" /> : LETTERS[i]}
                  </span>
                  <span className="text-[0.98rem] text-ink">{renderInline(opt)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {checked && (
          <div role="status" aria-live="polite" className={cn("mt-4 rounded-lg p-4 animate-pop-in", isCorrect ? "bg-pass-soft" : "bg-bug-soft")}>
            <p className={cn("flex items-center gap-2 font-semibold", isCorrect ? "text-pass" : "text-bug")}>
              {isCorrect ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <XCircle className="h-5 w-5" aria-hidden />}
              {isCorrect ? "Düzdür!" : "Səhvdir"}
            </p>
            {q.explanation && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{renderInline(q.explanation)}</p>}
          </div>
        )}

        <InlineError message={error} />

        <div className="mt-5 flex justify-end">
          <Button onClick={next} disabled={selected == null} loading={pending} size="lg" className="w-full sm:w-auto" variant={checked && isCorrect ? "success" : "primary"}>
            {!checked ? "Yoxla" : isLast ? "Nəticəni gör" : <>Növbəti <ArrowRight className="h-4 w-4" aria-hidden /></>}
          </Button>
        </div>
      </div>
    </BlockShell>
  );
}

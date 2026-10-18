"use client";

// CODE_EXERCISE block: CodeMirror editor + sandboxed runner + test results.
// The student's code runs in a Web Worker (src/lib/code-runner.ts); after each
// completed run we submit { passedTests, total, code } for grading.

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, Play, RotateCcw, Eye, Terminal, AlertTriangle, Code2, Undo2 } from "lucide-react";
import type { EditorView } from "@codemirror/view";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { runJavaScript, type RunResult, type LogLevel } from "@/lib/code-runner";
import type { CodeExerciseContent } from "@/types/blocks";
import { BlockShell, Feedback, HintList, InlineError, useAttempt, type InteractiveProps } from "../shared";

const storageKey = (blockId: string) => `narix:code:${blockId}`;

function readDraft(blockId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(blockId));
  } catch {
    return null;
  }
}

function writeDraft(blockId: string, code: string) {
  try {
    window.localStorage.setItem(storageKey(blockId), code);
  } catch {
    /* storage unavailable (private mode, quota) — drafts are a convenience */
  }
}

/** Inline formatting for instructions: `code` and **bold**; "- " lines become a list. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={i} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-iris-ink">
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function Instructions({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="ml-5 list-disc space-y-1">
        {list.map((l, i) => <li key={i}>{renderInline(l)}</li>)}
      </ul>
    );
    list = [];
  };
  for (const line of lines) {
    const m = /^\s*[-*]\s+(.*)$/.exec(line);
    if (m) {
      list.push(m[1]);
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`}>{renderInline(line)}</p>);
  }
  flush();
  return <div className="space-y-2 text-[0.95rem] leading-relaxed text-ink-2">{blocks}</div>;
}

const logStyles: Record<LogLevel, string> = {
  log: "text-code-ink",
  info: "text-sky-bright",
  warn: "text-xp-bright",
  error: "text-bug-bright",
};
const logLabels: Record<LogLevel, string> = { log: "", info: "info", warn: "xəbərdarlıq", error: "xəta" };

type View = "code" | "output";

export default function CodeExercise(props: InteractiveProps<CodeExerciseContent>) {
  const { content, blockId } = props;
  const { result, pending, error: submitError, submit } = useAttempt(props);

  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const runRef = useRef<() => void>(() => {});
  const showingSolutionRef = useRef(false);
  const ownCodeRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readOnlyToggle = useRef<(on: boolean) => void>(() => {});

  const [editorReady, setEditorReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<RunResult | null>(null);
  const [failedRuns, setFailedRuns] = useState(0);
  const [everPassed, setEverPassed] = useState(Boolean(props.initial?.passed));
  const [showingSolution, setShowingSolution] = useState(false);
  const [mobileView, setMobileView] = useState<View>("code");

  const initialCode = typeof props.initial?.answer?.code === "string" ? props.initial.answer.code : null;

  const getCode = () => viewRef.current?.state.doc.toString() ?? "";

  const setCode = useCallback((code: string) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
  }, []);

  // Mount CodeMirror once (lazy-loaded so it never runs during SSR).
  useEffect(() => {
    let destroyed = false;
    let view: EditorView | null = null;
    (async () => {
      const [{ basicSetup }, { EditorView: EV, keymap }, { EditorState, Compartment }, { javascript }, { oneDark }, { indentWithTab }] =
        await Promise.all([
          import("codemirror"),
          import("@codemirror/view"),
          import("@codemirror/state"),
          import("@codemirror/lang-javascript"),
          import("@codemirror/theme-one-dark"),
          import("@codemirror/commands"),
        ]);
      if (destroyed || !hostRef.current) return;

      const readOnly = new Compartment();
      const doc = readDraft(blockId) ?? initialCode ?? content.starterCode;

      view = new EV({
        parent: hostRef.current,
        state: EditorState.create({
          doc,
          extensions: [
            keymap.of([
              { key: "Mod-Enter", preventDefault: true, run: () => (runRef.current(), true) },
              indentWithTab,
            ]),
            basicSetup,
            javascript(),
            oneDark,
            EV.theme(
              {
                "&": { backgroundColor: "var(--c-code-bg)", color: "var(--c-code-ink)", fontSize: "inherit", height: "100%" },
                "&.cm-focused": { outline: "none" },
                ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6", minHeight: "16rem" },
                ".cm-gutters": { backgroundColor: "var(--c-code-bg)", border: "none" },
                ".cm-content": { padding: "12px 0" },
              },
              { dark: true }
            ),
            readOnly.of([]),
            EV.contentAttributes.of({ "aria-label": "JavaScript kod redaktoru", spellcheck: "false", autocapitalize: "off", autocorrect: "off" }),
            EV.updateListener.of((u) => {
              if (!u.docChanged || showingSolutionRef.current) return;
              if (saveTimer.current) clearTimeout(saveTimer.current);
              const code = u.state.doc.toString();
              saveTimer.current = setTimeout(() => writeDraft(blockId, code), 400);
            }),
          ],
        }),
      });
      // Expose the read-only toggle through the view for solution mode.
      readOnlyToggle.current = (on: boolean) =>
        view?.dispatch({ effects: readOnly.reconfigure(on ? [EditorState.readOnly.of(true), EV.editable.of(false)] : []) });
      viewRef.current = view;
      setEditorReady(true);
    })();
    return () => {
      destroyed = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      view?.destroy();
      viewRef.current = null;
    };
    // Mount once per block; later prop changes must not reset the student's work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId]);


  const handleRun = useCallback(async () => {
    if (running || !viewRef.current) return;
    const code = getCode();
    setRunning(true);
    const res = await runJavaScript(code, content.tests);
    setRun(res);
    setRunning(false);
    setMobileView("output");

    const total = content.tests.length;
    const passedTests = res.tests.filter((t) => t.passed).length;
    const allPassed = !res.error && passedTests === total;
    if (allPassed) setEverPassed(true);
    else setFailedRuns((n) => n + 1);

    // Only real attempts are graded: the solution preview never earns XP.
    if (!showingSolutionRef.current) await submit({ passedTests, total, code });
  }, [running, content.tests, submit]);

  useEffect(() => {
    runRef.current = () => void handleRun();
  }, [handleRun]);

  // CodeMirror measures lazily; re-measure when the mobile pane becomes visible.
  useEffect(() => {
    viewRef.current?.requestMeasure();
  }, [mobileView]);

  function handleReset() {
    if (showingSolution) exitSolution(false);
    setCode(content.starterCode);
    writeDraft(blockId, content.starterCode);
    setRun(null);
    setMobileView("code");
    viewRef.current?.focus();
  }

  function showSolution() {
    ownCodeRef.current = getCode();
    showingSolutionRef.current = true;
    setShowingSolution(true);
    setCode(content.solution);
    readOnlyToggle.current(true);
    setMobileView("code");
  }

  function exitSolution(restore = true) {
    showingSolutionRef.current = false;
    setShowingSolution(false);
    readOnlyToggle.current(false);
    if (restore && ownCodeRef.current !== null) setCode(ownCodeRef.current);
    ownCodeRef.current = null;
    viewRef.current?.focus();
  }

  const canShowSolution = Boolean(content.solution) && (failedRuns >= 2 || everPassed || Boolean(result?.passed));
  const passedCount = run ? run.tests.filter((t) => t.passed).length : 0;
  const total = content.tests.length;

  return (
    <BlockShell type={props.type} title={props.title} passed={result?.passed} wide>
      <Instructions text={content.instructions} />

      {/* Mobile pane switcher */}
      <div role="group" aria-label="Görünüş" className="mt-4 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-1 lg:hidden">
        {(
          [
            ["code", "Kod", Code2],
            ["output", "Nəticə", Terminal],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            aria-pressed={mobileView === key}
            onClick={() => setMobileView(key)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold motion-safe:transition-colors",
              mobileView === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {key === "output" && run && (
              <span className={cn("rounded px-1.5 text-xs", !run.error && passedCount === total ? "bg-pass-soft text-pass" : "bg-bug-soft text-bug")}>
                {passedCount}/{total}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Editor pane */}
        <div className={cn("min-w-0", mobileView !== "code" && "hidden lg:block")}>
          <div className="overflow-hidden rounded-lg border border-line bg-code-bg shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs text-code-ink/70">
              <span className="font-mono">main.js</span>
              <span className="hidden sm:inline">
                <kbd className="font-mono">Ctrl/⌘ + Enter</kbd> — işə sal
              </span>
            </div>
            <div
              ref={hostRef}
              className="min-h-64 text-base lg:text-[0.875rem]"
              aria-busy={!editorReady || undefined}
            >
              {!editorReady && (
                <pre className="m-0 whitespace-pre-wrap p-4 font-mono text-code-ink/60" aria-hidden>
                  {initialCode ?? content.starterCode}
                </pre>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Redaktordan klaviatura ilə çıxmaq üçün <kbd className="font-mono">Esc</kbd>, sonra <kbd className="font-mono">Tab</kbd> bas.
          </p>

          {showingSolution && (
            <div role="note" className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-xp/30 bg-xp-soft px-3 py-2.5 text-sm text-ink-2">
              <p className="flex min-w-0 flex-1 gap-2">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-xp" aria-hidden />
                <span>Bu nümunə həlldir (yalnız oxumaq üçün). İşə salmaq olar, amma nəticə qiymətləndirilmir və XP vermir.</span>
              </p>
              <Button size="sm" variant="secondary" onClick={() => exitSolution()} className="min-h-11 sm:min-h-9">
                <Undo2 className="h-4 w-4" aria-hidden /> Öz koduma qayıt
              </Button>
            </div>
          )}
        </div>

        {/* Output pane */}
        <div className={cn("min-w-0", mobileView !== "output" && "hidden lg:block")}>
          <OutputPanel run={run} running={running} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={() => void handleRun()} loading={running || pending} disabled={!editorReady} className="min-w-32">
          {!(running || pending) && <Play className="h-4 w-4" aria-hidden />}
          İşə sal
        </Button>
        <Button variant="secondary" onClick={handleReset} disabled={!editorReady || running}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Sıfırla
        </Button>
        {canShowSolution && !showingSolution && (
          <Button variant="ghost" onClick={showSolution} disabled={!editorReady || running}>
            <Eye className="h-4 w-4" aria-hidden /> Həlli göstər
          </Button>
        )}
      </div>

      {result && run && !showingSolution && (
        <Feedback
          result={result}
          successText="Əla iş!"
          failText="Hələ tam alınmayıb"
          explanation={
            run.error
              ? "Kod xəta ilə dayandı — əvvəlcə xətanı düzəlt, sonra yenidən işə sal."
              : passedCount === total
                ? "Bütün testlər keçdi."
                : `${passedCount}/${total} test keçdi. Keçməyən testlərə bax və kodu düzəlt.`
          }
        />
      )}
      <InlineError message={submitError} />
      <HintList hints={content.hints} />
    </BlockShell>
  );
}

function OutputPanel({ run, running }: { run: RunResult | null; running: boolean }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <section aria-label="Konsol" className="overflow-hidden rounded-lg border border-line bg-code-bg shadow-sm">
        <h4 className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-semibold text-code-ink/70">
          <Terminal className="h-3.5 w-3.5" aria-hidden /> Konsol
        </h4>
        <div className="max-h-64 min-h-24 overflow-auto px-3 py-2 font-mono text-[0.8125rem] leading-relaxed">
          {running ? (
            <p className="text-code-ink/60">İşləyir…</p>
          ) : !run ? (
            <p className="text-code-ink/50">Nəticəni görmək üçün “İşə sal” düyməsini bas.</p>
          ) : run.logs.length === 0 ? (
            <p className="text-code-ink/50">Konsola heç nə yazılmadı.</p>
          ) : (
            <ol className="space-y-0.5">
              {run.logs.map((l, i) => (
                <li key={i} className={cn("flex gap-2 whitespace-pre-wrap break-words", logStyles[l.level])}>
                  <span aria-hidden className="select-none text-code-ink/30">›</span>
                  <span className="min-w-0">
                    {logLabels[l.level] && <span className="sr-only">{logLabels[l.level]}: </span>}
                    {l.text}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {run?.error && !running && (
        <div role="alert" className="flex gap-2 rounded-lg border border-bug/30 bg-bug-soft px-3 py-2.5 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bug" aria-hidden />
          <p className="min-w-0 break-words font-mono text-[0.8125rem]">{run.error}</p>
        </div>
      )}

      {run && !running && (
        <section aria-label="Testlər" className="rounded-lg border border-line bg-surface">
          <h4 className="border-b border-line px-3 py-2 text-xs font-semibold text-muted">
            Testlər · {run.tests.filter((t) => t.passed).length}/{run.tests.length} keçdi
          </h4>
          <ul className="divide-y divide-line">
            {run.tests.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 px-3 py-2.5 text-sm">
                {t.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bug" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-ink">
                    <span className={cn("mr-1.5 font-semibold", t.passed ? "text-pass" : "text-bug")}>
                      {t.passed ? "Keçdi:" : "Keçmədi:"}
                    </span>
                    {t.name}
                  </p>
                  {t.error && <p className="mt-0.5 break-words font-mono text-xs text-muted">{t.error}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

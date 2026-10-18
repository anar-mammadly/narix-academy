"use client";

// Bug Hunt block: the learner tests a small fake app against its requirements,
// then switches on "flag mode" and clicks the elements that show a defect.
// Hits are detected by walking up to the nearest [data-bug] inside the app
// (the mini apps set it only while a defect is visible).

import {
  Fragment, useMemo, useRef, useState,
  type KeyboardEvent, type MouseEvent, type ComponentType,
} from "react";
import { Bug, CheckCircle2, Crosshair, Eye, Lock, RotateCw, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BUG_HUNT_PASS_RATIO, BUG_HUNT_SCENARIOS, type SeededBug } from "@/lib/bug-hunt";
import type { BugHuntContent, BugHuntScenario } from "@/types/blocks";
import { BlockShell, Feedback, InlineError, useAttempt, type InteractiveProps } from "../shared";
import LoginApp, { type MiniAppProps } from "../bug-hunt/LoginApp";
import RegistrationApp from "../bug-hunt/RegistrationApp";
import CartApp from "../bug-hunt/CartApp";

const APPS: Record<BugHuntScenario, { url: string; App: ComponentType<MiniAppProps> }> = {
  login: { url: "pay.narix.az/giris", App: LoginApp },
  registration: { url: "kurslar.narix.az/qeydiyyat", App: RegistrationApp },
  cart: { url: "shop.narix.az/cart", App: CartApp },
};

type Message = { id: number; kind: "hit" | "miss" | "repeat"; text: string };

/** Renders `code` spans inside bug explanations. */
function RichExplanation({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.length > 1 && part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[0.85em] text-ink">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

function readInitialFound(answer: Record<string, unknown> | undefined, valid: Set<string>): string[] {
  const raw = answer?.found;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === "string" && valid.has(x)))];
}

export default function BugHunt(props: InteractiveProps<BugHuntContent>) {
  const { content } = props;
  const scenario = BUG_HUNT_SCENARIOS[content.scenario];
  const app = APPS[content.scenario];
  const validIds = useMemo(() => new Set(scenario?.bugs.map((b) => b.id) ?? []), [scenario]);

  const { result, pending, error, submit } = useAttempt(props);
  const [found, setFound] = useState<string[]>(() => readInitialFound(props.initial?.answer, validIds));
  const [misses, setMisses] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [revealAll, setRevealAll] = useState(false);
  const [appKey, setAppKey] = useState(0);
  const appRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  if (!scenario || !app) {
    return (
      <BlockShell type={props.type} title={props.title}>
        <p className="text-sm text-muted">Bu ssenari mövcud deyil.</p>
      </BlockShell>
    );
  }

  const { App } = app;
  const total = scenario.bugs.length;
  const needed = Math.ceil(total * BUG_HUNT_PASS_RATIO);
  const byId = new Map<string, SeededBug>(scenario.bugs.map((b) => [b.id, b]));
  const foundBugs = found.map((id) => byId.get(id)).filter((b): b is SeededBug => !!b);
  const missedBugs = scenario.bugs.filter((b) => !found.includes(b.id));

  function say(kind: Message["kind"], text: string) {
    msgId.current += 1;
    setMessage({ id: msgId.current, kind, text });
  }

  function flag(target: EventTarget | null) {
    const root = appRef.current;
    if (!root || !(target instanceof Element)) return;
    const el = target.closest<HTMLElement>("[data-bug]");
    const bugId = el && root.contains(el) ? el.dataset.bug : undefined;
    const bug = bugId && validIds.has(bugId) ? byId.get(bugId) : undefined;
    if (!bug) {
      setMisses((m) => m + 1);
      say("miss", "Bu baq deyil. Tələblərə bir də bax.");
      return;
    }
    if (found.includes(bug.id)) {
      say("repeat", `“${bug.title}” artıq tapılıb.`);
      return;
    }
    setFound((f) => [...f, bug.id]);
    say("hit", `Baq tapıldı: ${bug.title}`);
  }

  // Capture-phase handlers: in flag mode the app never receives the interaction.
  function onMouseDownCapture(e: MouseEvent<HTMLDivElement>) {
    if (!flagMode) return;
    e.preventDefault(); // keep focus/selection where it is
  }
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (!flagMode) return;
    e.preventDefault();
    e.stopPropagation();
    flag(e.target);
  }
  function onKeyDownCapture(e: KeyboardEvent<HTMLDivElement>) {
    if (!flagMode) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setFlagMode(false);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      flag(e.target);
    }
  }

  const passed = result?.passed ?? props.initial?.passed ?? false;

  return (
    <BlockShell type={props.type} title={props.title ?? scenario.title} passed={passed} wide>
      {content.instructions && <p className="text-sm leading-relaxed text-ink-2">{content.instructions}</p>}

      <div className="mt-4 rounded-lg border border-line bg-surface-2/50 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Tələblər</h4>
        <ol className="mt-2 grid gap-1.5 text-sm text-ink-2">
          {scenario.requirements.map((r, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-iris-soft text-[0.7rem] font-semibold text-iris-ink">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Toolbar */}
      <div className="sticky top-2 z-10 mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface/95 p-3 shadow-[var(--shadow-pop)] backdrop-blur">
        <button
          type="button"
          aria-pressed={flagMode}
          onClick={() => setFlagMode((v) => !v)}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris",
            flagMode
              ? "border-bug bg-bug text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]"
              : "border-line bg-surface text-ink hover:bg-surface-2"
          )}
        >
          <Crosshair className="h-4 w-4" aria-hidden />
          Baq işarələ
          <span className="sr-only">{flagMode ? "(aktiv)" : "(deaktiv)"}</span>
        </button>

        <div className="flex min-w-[10rem] flex-1 items-center gap-3">
          <div className="relative flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink">
            <Bug className="h-4 w-4 text-bug" aria-hidden />
            Tapılan: <span className="tabular-nums">{found.length}/{total}</span>
            {found.length > 0 && (
              <span
                key={found.length}
                aria-hidden
                className="absolute -right-6 -top-3 rounded-full bg-pass-bright px-1.5 text-[0.65rem] font-bold text-[#06281c] animate-pop-in"
              >
                +1
              </span>
            )}
          </div>
          <ProgressBar
            value={(found.length / total) * 100}
            tone={found.length >= needed ? "pass" : "iris"}
            size="sm"
            label={`Tapılan baqlar: ${found.length}/${total}`}
            className="ml-4"
          />
        </div>
        <span className="text-xs text-muted tabular-nums">Səhv işarə: {misses}</span>

        <p className="w-full text-xs text-muted">
          {flagMode
            ? "Defekti göstərən elementə klik et və ya Tab ilə seçib Enter bas. Esc — testə qayıt."
            : "Əvvəlcə tətbiqi tələblərə görə test et, sonra “Baq işarələ” ilə defekti göstər."}
        </p>

        <div aria-live="polite" aria-atomic="true" className="w-full empty:hidden">
          {message && (
            <p
              key={message.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                message.kind === "hit" && "bg-pass-soft text-pass animate-pop-in",
                message.kind === "miss" && "bg-bug-soft text-bug animate-shake",
                message.kind === "repeat" && "bg-surface-2 text-ink-2 animate-pop-in"
              )}
            >
              {message.kind === "hit" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              ) : message.kind === "miss" ? (
                <SearchX className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Bug className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {message.text}
            </p>
          )}
        </div>
      </div>

      {/* Browser window */}
      <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
          <span className="hidden gap-1.5 sm:flex" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-bug-bright/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-xp-bright/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-pass-bright/70" />
          </span>
          <button
            type="button"
            onClick={() => setAppKey((k) => k + 1)}
            aria-label="Səhifəni yenilə"
            title="Səhifəni yenilə"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-3 hover:text-ink"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden />
          </button>
          <div className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs text-muted">
            <Lock className="h-3 w-3 shrink-0 text-pass" aria-hidden />
            <span className="truncate">
              <span className="sr-only">Ünvan: </span>https://<span className="text-ink-2">{app.url}</span>
            </span>
          </div>
        </div>

        <div
          ref={appRef}
          role="group"
          aria-label={`Test ediləcək tətbiq: ${scenario.title}`}
          onMouseDownCapture={onMouseDownCapture}
          onClickCapture={onClickCapture}
          onKeyDownCapture={onKeyDownCapture}
          className={cn(
            "relative min-h-[18rem] overflow-x-hidden bg-bg/40 transition-shadow",
            flagMode &&
              "cursor-crosshair ring-2 ring-inset ring-bug/50 [&_*]:cursor-crosshair [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-offset-2 [&_*:focus-visible]:outline-bug"
          )}
        >
          <App key={appKey} flagMode={flagMode} />
        </div>
      </div>

      {/* Found bugs */}
      {(foundBugs.length > 0 || revealAll) && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-ink">Baq siyahısı</h4>
          <ul className="mt-2 grid gap-2">
            {foundBugs.map((b) => (
              <li key={b.id} className="flex gap-3 rounded-lg border border-pass/30 bg-pass-soft/50 p-3 animate-pop-in">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-label="Tapıldı" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-ink">{b.title}</p>
                  <p className="mt-0.5 leading-relaxed text-ink-2"><RichExplanation text={b.explanation} /></p>
                </div>
              </li>
            ))}
            {revealAll &&
              missedBugs.map((b) => (
                <li key={b.id} className="flex gap-3 rounded-lg border border-dashed border-line-strong bg-surface-2/50 p-3 animate-pop-in">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label="Tapılmadı" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-ink">
                      {b.title} <span className="ml-1 text-xs font-normal text-muted">(tapılmadı)</span>
                    </p>
                    <p className="mt-0.5 leading-relaxed text-ink-2"><RichExplanation text={b.explanation} /></p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => submit({ found })} loading={pending} disabled={found.length === 0}>
          Nəticəni yoxla
        </Button>
        {passed && missedBugs.length > 0 && !revealAll && (
          <Button variant="ghost" onClick={() => setRevealAll(true)}>
            <Eye className="h-4 w-4" aria-hidden /> Tapılmayan baqları göstər
          </Button>
        )}
        <span className="text-xs text-muted">Keçmək üçün ən az {needed} baq tap.</span>
      </div>

      <InlineError message={error} />
      {result && (
        <Feedback
          result={result}
          successText={`Əla! ${found.length}/${total} baq tapdın.`}
          failText={`Hələ ${found.length}/${total}. Ən az ${needed} baq lazımdır, test etməyə davam et.`}
        />
      )}
    </BlockShell>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Flame, Lock, MessageCircle, NotebookPen, Puzzle, Trophy, X, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Modal, Sheet } from "@/components/ui/Modal";
import { ProgressRing } from "@/components/ui/ProgressBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";
import { INTERACTIVE_BLOCKS, parseJson, type BlockType, type HeadingContent, type LessonBlockData } from "@/types/blocks";
import { levelFromXp, type Reward } from "@/lib/game";
import { DEFAULT_PASS_MARK, type GradeResult } from "@/lib/grading";
import { burst } from "@/components/game/celebrate";
import { BlockRenderer } from "./BlockRenderer";
import { slugifyHeading } from "./blocks/ReadingBlocks";
import { NotesPanel, QuestionsPanel, type QuestionItem } from "./LessonPanels";
import { PlayerContext, type AttemptState } from "./shared";

export type PlayerLesson = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  estimatedMinutes: number;
  minQuizScore: number | null;
  module: { title: string; color: string };
  blocks: LessonBlockData[];
};

type NavLesson = { slug: string; title: string; locked?: boolean } | null;

export type LessonPlayerProps = {
  lesson: PlayerLesson;
  attempts: Record<string, NonNullable<AttemptState>>;
  submissions: Record<string, string>;
  note: string;
  questions: QuestionItem[];
  completed: boolean;
  prev: NavLesson;
  next: NavLesson;
  user: { name: string; xp: number; streak: number };
  previewMode?: boolean;
  backHref: string;
  hrefFor: (slug: string) => string;
};

const BLOCK_SPACING: Partial<Record<BlockType, string>> = { HEADING: "mt-10 first:mt-0" };

export default function LessonPlayer(p: Omit<LessonPlayerProps, "hrefFor"> & { linkBase: string }) {
  const { lesson, previewMode = false } = p;
  const router = useRouter();
  const toast = useToast();
  const passMark = lesson.minQuizScore ?? DEFAULT_PASS_MARK;

  const [xp, setXp] = useState(p.user.xp);
  const [streak, setStreak] = useState(p.user.streak);
  const [graded, setGraded] = useState<Record<string, { score: number; passed: boolean }>>(() =>
    Object.fromEntries(Object.entries(p.attempts).map(([k, v]) => [k, { score: v.score, passed: v.passed }]))
  );
  const [completed, setCompleted] = useState(p.completed);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"notes" | "qa" | null>(null);
  const [celebration, setCelebration] = useState<Reward | null>(null);
  const [scroll, setScroll] = useState(0);

  const interactive = useMemo(() => lesson.blocks.filter((b) => INTERACTIVE_BLOCKS.includes(b.type as BlockType)), [lesson.blocks]);
  const finalQuiz = useMemo(() => [...lesson.blocks].reverse().find((b) => b.type === "QUIZ"), [lesson.blocks]);
  const passedCount = interactive.filter((b) => graded[b.id]?.passed).length;
  const quizOk = !finalQuiz || (graded[finalQuiz.id]?.score ?? 0) >= passMark;
  const headings = useMemo(
    () => lesson.blocks.filter((b) => b.type === "HEADING").map((b) => parseJson<HeadingContent>(b.content, { text: "", level: 2 })).filter((h) => h.text && (h.level ?? 2) === 2),
    [lesson.blocks]
  );
  const level = levelFromXp(xp);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScroll(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onReward = useCallback((r: Reward) => {
    setXp(r.totalXp);
    setStreak(r.streak);
    if (r.xpGained > 0) toast({ variant: "xp", title: `+${r.xpGained} XP`, description: r.leveledUp ? `Yeni səviyyə: ${r.level}` : undefined });
    for (const a of r.achievements) toast({ variant: "success", title: "Yeni nailiyyət", description: a.title });
    if (r.leveledUp || r.achievements.length) burst("small");
  }, [toast]);

  const onGraded = useCallback((blockId: string, g: GradeResult) => {
    setGraded((prev) => ({ ...prev, [blockId]: { score: Math.max(prev[blockId]?.score ?? 0, g.score), passed: (prev[blockId]?.passed ?? false) || g.passed } }));
    if (g.passed) burst("small");
  }, []);

  async function complete() {
    setCompleting(true);
    setCompleteError(null);
    try {
      if (previewMode) {
        setCompleted(true);
        setCelebration({ xpGained: 25, totalXp: xp, level: level.level, leveledUp: false, streak, achievements: [] });
      } else {
        const res = await fetch("/api/progress/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Dərs tamamlanmadı");
        setCompleted(true);
        setXp(data.reward.totalXp);
        setStreak(data.reward.streak);
        setCelebration(data.reward);
        router.refresh();
      }
      burst("big");
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : "Dərs tamamlanmadı");
    } finally {
      setCompleting(false);
    }
  }

  const href = (slug: string) => `${p.linkBase}/${slug}`;

  return (
    <PlayerContext.Provider value={{ previewMode, passMark, onReward, onGraded }}>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <Link href={p.backHref} className={buttonStyles({ variant: "ghost", size: "icon" })} aria-label="Dərsdən çıx">
            <X className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted">{lesson.module.title}</p>
            <p className="truncate text-sm font-semibold text-ink">{lesson.title}</p>
          </div>
          {interactive.length > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-ink-2 sm:flex" title="Tapşırıqlar">
              <Puzzle className="h-4 w-4 text-iris" aria-hidden /> {passedCount}/{interactive.length}
            </span>
          )}
          {!previewMode && (
            <>
              <span className="flex items-center gap-1 rounded-full bg-flame-soft px-2.5 py-1 text-sm font-semibold text-flame" title="Ardıcıl günlər">
                <Flame className="h-4 w-4" aria-hidden /> {streak}
                <span className="sr-only">gün ardıcıl</span>
              </span>
              <span className="flex items-center gap-1 rounded-full bg-xp-soft px-2.5 py-1 text-sm font-semibold text-xp" title={`Səviyyə ${level.level}`}>
                <Zap className="h-4 w-4 fill-current" aria-hidden /> {xp}
                <span className="sr-only">XP</span>
              </span>
            </>
          )}
          <button onClick={() => setPanel("notes")} className={buttonStyles({ variant: "ghost", size: "icon" })} aria-label="Qeydlərim">
            <NotebookPen className="h-[18px] w-[18px]" />
          </button>
          <button onClick={() => setPanel("qa")} className={cn(buttonStyles({ variant: "ghost", size: "icon" }), "relative")} aria-label={`Suallar (${p.questions.length})`}>
            <MessageCircle className="h-[18px] w-[18px]" />
            {p.questions.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-iris" aria-hidden />}
          </button>
          <ThemeToggle className="hidden sm:grid" />
        </div>
        <div className="h-[3px] bg-transparent" aria-hidden>
          <div className="h-full bg-iris transition-[width] duration-150" style={{ width: `${scroll}%` }} />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 pb-32 pt-8 sm:px-6 lg:pt-12">
        {/* ── Article ── */}
        <article className="mx-auto w-full min-w-0 max-w-[720px]">
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2">
              <span className="h-2 w-2 rounded-full" style={{ background: lesson.module.color }} aria-hidden />
              {lesson.module.title}
            </span>
            <h1 className="mt-4 font-display text-[1.75rem] font-semibold leading-tight text-ink sm:text-[2.25rem]">{lesson.title}</h1>
            {lesson.shortDescription && <p className="mt-3 text-lg leading-relaxed text-ink-2">{lesson.shortDescription}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden /> {lesson.estimatedMinutes} dəq</span>
              {interactive.length > 0 && <span className="flex items-center gap-1.5"><Puzzle className="h-4 w-4" aria-hidden /> {interactive.length} interaktiv tapşırıq</span>}
              {completed && <span className="flex items-center gap-1.5 font-medium text-pass"><CheckCircle2 className="h-4 w-4" aria-hidden /> Tamamlanıb</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {lesson.blocks.map((b) => (
              <div key={b.id} id={`block-${b.id}`} className={cn("scroll-mt-24", BLOCK_SPACING[b.type as BlockType])}>
                <BlockRenderer block={b} lessonId={lesson.id} attempt={p.attempts[b.id] ?? null} submission={p.submissions[b.id] ?? null} />
              </div>
            ))}
          </div>

          {/* ── Finish ── */}
          <section aria-label="Dərsin sonu" className="mt-14 rounded-2xl border border-line bg-surface p-6 text-center sm:p-8">
            {completed ? (
              <>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pass-soft text-pass"><Trophy className="h-7 w-7" aria-hidden /></div>
                <h2 className="mt-4 font-display text-xl font-semibold text-ink">Dərs tamamlandı</h2>
                <p className="mt-1 text-ink-2">{p.next ? "Növbəti dərs səni gözləyir." : "Bu modulun sonuna çatdın."}</p>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold text-ink">Dərsi bitirməyə hazırsan?</h2>
                <p className="mt-1 text-ink-2">
                  {quizOk ? `Tamamla və +25 XP qazan.` : `Əvvəlcə yekun quizdən ən az ${passMark}% topla.`}
                </p>
                {completeError && <p role="alert" className="mt-3 text-sm text-bug">{completeError}</p>}
                <div className="mt-5 flex justify-center gap-2">
                  {!quizOk && finalQuiz ? (
                    <Button variant="secondary" size="lg" onClick={() => document.getElementById(`block-${finalQuiz.id}`)?.scrollIntoView({ behavior: "smooth" })}>
                      Quizə keç
                    </Button>
                  ) : (
                    <Button size="lg" variant="success" onClick={complete} loading={completing}>
                      <CheckCircle2 className="h-5 w-5" aria-hidden /> Dərsi tamamla
                    </Button>
                  )}
                </div>
              </>
            )}
          </section>

          <nav aria-label="Dərslər arası keçid" className="mt-6 grid gap-3 sm:grid-cols-2">
            {p.prev ? (
              <Link href={href(p.prev.slug)} className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-iris/40">
                <span className="flex items-center gap-1 text-xs text-muted"><ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Əvvəlki</span>
                <span className="mt-1 block font-semibold text-ink group-hover:text-iris">{p.prev.title}</span>
              </Link>
            ) : <span />}
            {p.next && (
              p.next.locked && !completed ? (
                <div className="rounded-xl border border-dashed border-line-strong p-4 text-right opacity-70">
                  <span className="flex items-center justify-end gap-1 text-xs text-muted"><Lock className="h-3.5 w-3.5" aria-hidden /> Bu dərsi bitirəndən sonra açılır</span>
                  <span className="mt-1 block font-semibold text-ink-2">{p.next.title}</span>
                </div>
              ) : (
                <Link href={href(p.next.slug)} className="group rounded-xl border border-line bg-surface p-4 text-right transition-colors hover:border-iris/40">
                  <span className="flex items-center justify-end gap-1 text-xs text-muted">Növbəti <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
                  <span className="mt-1 block font-semibold text-ink group-hover:text-iris">{p.next.title}</span>
                </Link>
              )
            )}
          </nav>
        </article>

        {/* ── Outline (wide screens) ── */}
        <aside className="sticky top-24 hidden h-fit w-60 shrink-0 xl:block" aria-label="Dərsin planı">
          <p className="mb-3 text-sm font-semibold text-ink">Dərsin planı</p>
          <ol className="grid gap-1 border-l border-line">
            {headings.map((h) => (
              <li key={h.text}>
                <a href={`#${slugifyHeading(h.text)}`} className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted hover:border-iris hover:text-ink">
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
          {interactive.length > 0 && (
            <div className="mt-6 rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <ProgressRing value={(passedCount / interactive.length) * 100} size={44} stroke={5} tone="pass" label="Tapşırıqlar">
                  <span className="text-xs font-semibold">{passedCount}</span>
                </ProgressRing>
                <div>
                  <p className="text-sm font-semibold text-ink">Tapşırıqlar</p>
                  <p className="text-xs text-muted">{interactive.length} tapşırıqdan {passedCount} keçildi</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Sheet open={panel === "notes"} onOpenChange={(o) => setPanel(o ? "notes" : null)} title="Qeydlərim">
        <NotesPanel lessonId={lesson.id} initial={p.note} previewMode={previewMode} />
      </Sheet>
      <Sheet open={panel === "qa"} onOpenChange={(o) => setPanel(o ? "qa" : null)} title="Suallar">
        <QuestionsPanel lessonId={lesson.id} initial={p.questions} previewMode={previewMode} userName={p.user.name} />
      </Sheet>

      <Modal open={celebration != null} onOpenChange={(o) => !o && setCelebration(null)} title="Dərs tamamlandı!">
        {celebration && (
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-xp-soft animate-pop-in">
              <Zap className="h-10 w-10 fill-xp-bright text-xp-bright" aria-hidden />
            </div>
            <p className="font-display text-3xl font-semibold text-ink">+{celebration.xpGained} XP</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-muted">Səviyyə</p>
                <p className="font-semibold text-ink">{celebration.level} · {levelFromXp(celebration.totalXp).title}</p>
              </div>
              <div className="rounded-lg bg-flame-soft p-3">
                <p className="text-xs text-muted">Ardıcıl günlər</p>
                <p className="flex items-center gap-1 font-semibold text-flame"><Flame className="h-4 w-4" aria-hidden /> {celebration.streak} gün</p>
              </div>
            </div>
            {celebration.leveledUp && <p className="mt-3 rounded-lg bg-iris-soft p-3 font-semibold text-iris-ink">Yeni səviyyəyə qalxdın!</p>}
            {celebration.achievements.length > 0 && (
              <ul className="mt-3 grid gap-2">
                {celebration.achievements.map((a) => (
                  <li key={a.key} className="flex items-center gap-2 rounded-lg border border-xp-bright/40 bg-xp-soft p-3 text-left text-sm font-semibold text-ink">
                    <Trophy className="h-4 w-4 text-xp" aria-hidden /> Nailiyyət: {a.title}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={p.backHref} className={buttonStyles({ variant: "secondary", size: "lg" })}>Öyrənmə yolu</Link>
              {p.next ? (
                <Link href={href(p.next.slug)} className={buttonStyles({ size: "lg" })}>Növbəti dərs <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              ) : (
                <Button size="lg" onClick={() => setCelebration(null)}>Bağla</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PlayerContext.Provider>
  );
}

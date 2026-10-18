"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers, PartyPopper, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonStyles } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { renderInline } from "@/components/lesson/RichText";
import { burst } from "@/components/game/celebrate";
import type { Reward } from "@/lib/game";

export type ReviewCard = { id: string; box: number; text: string; options: string[]; lessonTitle: string; lessonSlug: string };

type Checked = { correct: boolean; correctIndex: number; explanation: string | null };

export default function ReviewSession({ cards, upcoming }: { cards: ReviewCard[]; upcoming: number }) {
  const router = useRouter();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState<Checked | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [right, setRight] = useState(0);

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-6 w-6" />}
        title="Bu gün üçün təkrar yoxdur"
        description={upcoming ? `${upcoming} kart sonrakı günlərdə qayıdacaq.` : "Quizlərdə səhv etdiyin suallar bura düşəcək."}
        action={<Link href="/dashboard/lessons" className={buttonStyles({ variant: "secondary" })}>Dərslərə keç</Link>}
      />
    );
  }

  if (index >= cards.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center" role="status">
        <PartyPopper className="mx-auto h-10 w-10 text-xp" aria-hidden />
        <h2 className="mt-3 font-display text-xl font-semibold text-ink">Təkrar bitdi</h2>
        <p className="mt-1 text-ink-2">{cards.length} kartdan {right} düz cavab.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}>Ana səhifə</Link>
          <Button onClick={() => router.refresh()}>Yenilə</Button>
        </div>
      </div>
    );
  }

  const card = cards[index];

  async function check() {
    if (selected == null) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: card.id, answerIndex: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yoxlanmadı");
      setChecked({ correct: data.correct, correctIndex: data.correctIndex, explanation: data.explanation });
      if (data.correct) {
        setRight((r) => r + 1);
        const reward = data.reward as Reward | null;
        if (reward?.xpGained) toast({ variant: "xp", title: `+${reward.xpGained} XP` });
        if (index === cards.length - 1) burst("small");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setPending(false);
    }
  }

  function next() {
    setIndex(index + 1);
    setSelected(null);
    setChecked(null);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <ProgressBar value={(index / cards.length) * 100} tone="iris" label="Təkrar irəliləyişi" />
        <span className="shrink-0 text-sm tabular-nums text-muted">{index + 1}/{cards.length}</span>
      </div>
      <p className="mb-1 text-xs text-muted">
        <Link href={`/learn/${card.lessonSlug}`} className="hover:text-iris hover:underline">{card.lessonTitle}</Link> · Qutu {card.box}/5
      </p>
      <fieldset>
        <legend className="mb-4 text-lg font-semibold leading-snug text-ink">{renderInline(card.text)}</legend>
        <div className="grid gap-2.5">
          {card.options.map((opt, i) => {
            const right = checked && i === checked.correctIndex;
            const wrong = checked && selected === i && !checked.correct;
            return (
              <label
                key={i}
                className={cn(
                  "flex min-h-13 cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3",
                  right ? "border-pass bg-pass-soft" : wrong ? "border-bug bg-bug-soft" : selected === i ? "border-iris bg-iris-soft" : "border-line hover:bg-surface-2",
                  checked && "cursor-default"
                )}
              >
                <input type="radio" name={`review-${card.id}`} className="sr-only" checked={selected === i} disabled={!!checked} onChange={() => setSelected(i)} />
                {right ? <CheckCircle2 className="h-5 w-5 shrink-0 text-pass" aria-label="Düzgün cavab" /> : wrong ? <XCircle className="h-5 w-5 shrink-0 text-bug" aria-label="Sənin cavabın" /> : (
                  <span aria-hidden className={cn("h-5 w-5 shrink-0 rounded-full border-2", selected === i ? "border-[6px] border-iris" : "border-line-strong")} />
                )}
                <span className="text-ink">{renderInline(opt)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {checked && (
        <div role="status" aria-live="polite" className={cn("mt-4 rounded-lg p-4 animate-pop-in", checked.correct ? "bg-pass-soft" : "bg-bug-soft")}>
          <p className={cn("font-semibold", checked.correct ? "text-pass" : "text-bug")}>
            {checked.correct ? "Düzdür! Bu kart daha gec qayıdacaq." : "Səhvdir. Kart sabah yenidən gələcək."}
          </p>
          {checked.explanation && <p className="mt-1 text-sm text-ink-2">{renderInline(checked.explanation)}</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-bug">{error}</p>}

      <div className="mt-5 flex justify-end">
        {checked ? (
          <Button size="lg" onClick={next} className="w-full sm:w-auto">Növbəti <ArrowRight className="h-4 w-4" aria-hidden /></Button>
        ) : (
          <Button size="lg" onClick={check} disabled={selected == null} loading={pending} className="w-full sm:w-auto">Yoxla</Button>
        )}
      </div>
    </div>
  );
}

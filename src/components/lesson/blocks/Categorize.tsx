"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { BlockShell, Feedback, InlineError, seededShuffle, useAttempt, type InteractiveProps } from "../shared";
import { RichText, renderInline } from "../RichText";
import type { CategorizeContent } from "@/types/blocks";

const tones = [
  "border-iris bg-iris text-white",
  "border-sky-bright bg-sky-bright text-[#032a40]",
  "border-flame-bright bg-flame-bright text-[#3a1600]",
  "border-pass-bright bg-pass-bright text-[#06281c]",
  "border-xp-bright bg-xp-bright text-[#3a2500]",
  "border-bug bg-bug text-white",
];

/** Each item gets a row of category buttons: works the same with mouse, touch and keyboard. */
export default function Categorize(props: InteractiveProps<CategorizeContent>) {
  const { categories, items } = props.content;
  const { result, pending, error, submit, reset } = useAttempt(props);
  const shuffled = useMemo(() => seededShuffle(items, props.blockId), [items, props.blockId]);
  const [placement, setPlacement] = useState<Record<string, string>>(
    (props.initial?.answer?.placement as Record<string, string>) ?? {}
  );
  const locked = result != null;
  const done = Object.keys(placement).filter((k) => items.some((i) => i.id === k)).length;
  const toneOf = (catId: string) => tones[categories.findIndex((c) => c.id === catId) % tones.length];

  return (
    <BlockShell type="CATEGORIZE" title={props.title} passed={result?.passed}>
      <RichText text={props.content.instructions} className="mb-4" />
      <ul className="grid gap-2.5">
        {shuffled.map((item) => {
          const chosen = placement[item.id];
          const right = locked && chosen === item.categoryId;
          const wrong = locked && chosen !== item.categoryId;
          return (
            <li key={item.id} className={cn("rounded-lg border-2 p-3", right ? "border-pass/50 bg-pass-soft" : wrong ? "border-bug/50 bg-bug-soft" : "border-line")}>
              <fieldset>
                <legend className="mb-2.5 flex w-full items-start gap-2 text-[0.97rem] text-ink">
                  {right && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pass" aria-label="Düz" />}
                  {wrong && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-bug" aria-label="Səhv" />}
                  <span>{renderInline(item.text)}</span>
                </legend>
                <div className="flex flex-wrap gap-1.5" role="radiogroup">
                  {categories.map((cat) => {
                    const active = chosen === cat.id;
                    const isAnswer = locked && wrong && cat.id === item.categoryId;
                    return (
                      <button
                        key={cat.id}
                        role="radio"
                        aria-checked={active}
                        disabled={locked}
                        onClick={() => setPlacement({ ...placement, [item.id]: cat.id })}
                        className={cn(
                          "min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors disabled:cursor-default",
                          active ? toneOf(cat.id) : "border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-2",
                          isAnswer && "ring-2 ring-pass ring-offset-2 ring-offset-surface"
                        )}
                      >
                        {cat.label}
                        {isAnswer && <span className="sr-only"> (düzgün cavab)</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>
      <InlineError message={error} />
      {result ? (
        <Feedback
          result={result}
          successText="Hamısı düzgün qruplaşdırıldı!"
          failText="Bəzi elementlər səhv qrupdadır — düzgün qrup halqa ilə göstərilib"
          explanation={props.content.explanation ? <RichText text={props.content.explanation} /> : undefined}
          onRetry={result.passed ? undefined : () => { reset(); }}
        />
      ) : (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-muted">{done}/{items.length} seçildi</span>
          <Button onClick={() => submit({ placement })} disabled={done < items.length} loading={pending}>Yoxla</Button>
        </div>
      )}
    </BlockShell>
  );
}

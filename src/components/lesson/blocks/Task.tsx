"use client";

import { useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { BlockShell, InlineError, PlayerContext } from "../shared";
import { RichText } from "../RichText";
import type { TaskContent } from "@/types/blocks";

/** Open answer, reviewed by the teacher (no automatic grading). */
export default function Task({
  blockId, lessonId, title, content, initialAnswer,
}: { blockId: string; lessonId: string; title?: string | null; content: TaskContent; initialAnswer: string | null }) {
  const { previewMode } = useContext(PlayerContext);
  const [text, setText] = useState(initialAnswer ?? "");
  const [saved, setSaved] = useState(initialAnswer ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = text.trim() !== (saved ?? "").trim();

  async function send() {
    setPending(true);
    setError(null);
    try {
      if (!previewMode) {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, blockId, answer: text }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Göndərilmədi");
      }
      setSaved(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Göndərilmədi");
    } finally {
      setPending(false);
    }
  }

  return (
    <BlockShell type="TASK" title={title}>
      <RichText text={content.instructions} className="mb-3" />
      <label htmlFor={`task-${blockId}`} className="sr-only">Cavabın</label>
      <Textarea
        id={`task-${blockId}`}
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={content.placeholder || "Cavabını bura yaz…"}
      />
      <InlineError message={error} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {saved && !dirty ? (
            <span className="flex items-center gap-1.5 text-pass"><CheckCircle2 className="h-4 w-4" aria-hidden /> Göndərildi — müəllim baxacaq</span>
          ) : dirty && saved ? "Dəyişiklik göndərilməyib" : "Müəllim cavabını yoxlayacaq"}
        </p>
        <Button onClick={send} disabled={!text.trim() || !dirty} loading={pending}>
          {saved ? "Yenilə" : "Göndər"}
        </Button>
      </div>
    </BlockShell>
  );
}

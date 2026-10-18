"use client";

import { useId, useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

/**
 * Raw JSON editor for block content. Keeps its own text so half-typed JSON is never lost;
 * calls onChange only with parseable JSON (the card then runs validateBlock on it).
 */
export function JsonEditor({ value, onChange, hint }: { value: unknown; onChange: (next: unknown) => void; hint?: string }) {
  const id = useId();
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  function update(next: string) {
    setText(next);
    try {
      const parsed: unknown = JSON.parse(next);
      setParseError(null);
      onChange(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message.replace(/^JSON\.parse: /, "") : "JSON düzgün deyil");
    }
  }

  function format() {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      /* keep text as is; error is already shown */
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">Məzmun (JSON)</label>
        <Button variant="ghost" size="sm" onClick={format} disabled={!!parseError}>
          <Braces className="h-4 w-4" aria-hidden /> Formatla
        </Button>
      </div>
      <Textarea
        id={id}
        rows={Math.min(24, Math.max(8, text.split("\n").length + 1))}
        spellCheck={false}
        value={text}
        onChange={(e) => update(e.target.value)}
        aria-invalid={parseError ? true : undefined}
        aria-describedby={`${id}-msg`}
        className="bg-code-bg font-mono text-[0.8125rem] leading-relaxed text-code-ink"
      />
      <p id={`${id}-msg`} className={parseError ? "mt-1.5 text-sm text-bug" : "mt-1.5 text-xs text-muted"} aria-live="polite">
        {parseError ? `JSON xətası: ${parseError}` : hint ?? "Dəyişikliklər JSON düzgün olduqda və yoxlamadan keçdikdə saxlanılır."}
      </p>
    </div>
  );
}

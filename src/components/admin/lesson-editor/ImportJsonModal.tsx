"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, FileUp, Sparkles, XCircle } from "lucide-react";
import { validateBlock } from "@/lib/block-schema";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "../ConfirmModal";
import { RequestError, errorMessage, requestJson } from "../request";
import { BLOCK_META, SAMPLE_IMPORT, isBlockType } from "./block-meta";
import { checkBlock } from "./validate";
import type { EditorBlock } from "./types";

type Row = { index: number; type: string; ok: boolean; issues: string[] };
type Parsed = { error: string } | { blocks: unknown[]; rows: Row[] };

function normalize(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const b = raw as Record<string, unknown>;
  if (typeof b.content === "string") {
    try {
      return { ...b, content: JSON.parse(b.content) };
    } catch {
      return b; // validation will report it
    }
  }
  return b;
}

function parse(text: string): Parsed | null {
  if (!text.trim()) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { error: `JSON oxunmadı: ${e instanceof Error ? e.message : ""}` };
  }
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { blocks?: unknown }).blocks)
      ? (data as { blocks: unknown[] }).blocks
      : null;
  if (!list) return { error: "Blok massivi və ya { \"blocks\": [...] } obyekti gözlənilir." };
  if (list.length === 0) return { error: "Massiv boşdur." };

  const blocks = list.map(normalize);
  const rows: Row[] = blocks.map((b, index) => {
    const rec = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
    const type = typeof rec.type === "string" ? rec.type : "?";
    const base = validateBlock(b);
    if (base.ok) return { index, type, ok: true, issues: [] };
    if (!isBlockType(type)) return { index, type, ok: false, issues: [`Naməlum blok tipi: “${type}”`] };
    const friendly = checkBlock(type, typeof rec.title === "string" ? rec.title : null, rec.content);
    return { index, type, ok: false, issues: friendly.ok ? [base.error] : friendly.issues };
  });
  return { blocks, rows };
}

export function ImportJsonModal({
  open, onOpenChange, lessonId, existingCount, onImported,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lessonId: string;
  existingCount: number;
  onImported: (blocks: EditorBlock[], count: number) => void;
}) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverRows, setServerRows] = useState<Record<number, string> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parse(text), [text]);
  const rows = parsed && "rows" in parsed ? parsed.rows : [];
  const invalid = rows.filter((r) => !r.ok).length;
  const ready = !!parsed && "rows" in parsed && invalid === 0;

  function reset() {
    setText("");
    setMode("append");
    setServerError(null);
    setServerRows(null);
  }

  async function submit() {
    if (!parsed || !("blocks" in parsed)) return;
    setBusy(true);
    setServerError(null);
    setServerRows(null);
    try {
      const res = await requestJson<{ imported: number; blocks: EditorBlock[] }>(`/api/lessons/${lessonId}/blocks/import`, "POST", {
        mode: existingCount ? mode : "append",
        blocks: parsed.blocks,
      });
      setConfirmReplace(false);
      onImported(res.blocks, res.imported);
      reset();
      onOpenChange(false);
    } catch (e) {
      setConfirmReplace(false);
      setServerError(errorMessage(e));
      if (e instanceof RequestError && e.data && typeof e.data === "object" && "errors" in e.data) {
        const list = (e.data as { errors: { index: number; error: string }[] }).errors;
        setServerRows(Object.fromEntries(list.map((x) => [x.index, x.error])));
      }
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setServerError("Fayl 2MB-dan böyükdür.");
      return;
    }
    setText(await file.text());
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(o) => {
          if (busy) return;
          onOpenChange(o);
        }}
        title="JSON-dan idxal"
        description="Blok massivi və ya { blocks: [...] } yapışdırın. Hamısı yoxlanılır, yalnız xətasız olduqda idxal olunur."
        className="sm:max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4" aria-hidden /> .json faylı seç
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE_IMPORT)}>
              <Sparkles className="h-4 w-4" aria-hidden /> Nümunə doldur
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void loadFile(f);
                e.target.value = "";
              }}
            />
          </div>

          <Textarea
            aria-label="İdxal ediləcək JSON"
            rows={10}
            spellCheck={false}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setServerRows(null);
              setServerError(null);
            }}
            placeholder='[{ "type": "TEXT", "content": { "body": "…" } }]'
            className="bg-code-bg font-mono text-[0.8125rem] text-code-ink"
          />

          {parsed && "error" in parsed && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{parsed.error}</p>}

          {rows.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink-2" aria-live="polite">
                {invalid === 0 ? `${rows.length} blok yoxlamadan keçdi` : `${invalid} / ${rows.length} blokda xəta var`}
              </p>
              <ol className="max-h-64 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                {rows.map((r) => {
                  const serverIssue = serverRows?.[r.index];
                  const ok = r.ok && !serverIssue;
                  return (
                    <li key={r.index} className={cn("flex gap-2.5 px-3 py-2 text-sm", !ok && "bg-bug-soft/40")}>
                      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-label="Düzgün" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-bug" aria-label="Xəta" />}
                      <div className="min-w-0">
                        <span className="font-semibold text-ink">#{r.index + 1} {isBlockType(r.type) ? BLOCK_META[r.type].label : r.type}</span>
                        {!ok && (
                          <ul className="mt-0.5 space-y-0.5 text-ink-2">
                            {(serverIssue ? [serverIssue] : r.issues).map((m) => <li key={m} className="break-words">{m}</li>)}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {existingCount > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-2">Mövcud {existingCount} blok</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  { v: "append", t: "Sona əlavə et", d: "Mövcud bloklar qalır" },
                  { v: "replace", t: "Mövcud blokları əvəz et", d: "Köhnə bloklar silinir" },
                ] as const).map((o) => (
                  <label
                    key={o.v}
                    className={cn(
                      "flex cursor-pointer gap-2.5 rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-iris",
                      mode === o.v ? (o.v === "replace" ? "border-bug/60 bg-bug-soft/50" : "border-iris bg-iris-soft/60") : "border-line"
                    )}
                  >
                    <input type="radio" name="import-mode" value={o.v} checked={mode === o.v} onChange={() => setMode(o.v)} className="mt-1 accent-[var(--c-iris)]" />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{o.t}</span>
                      <span className="block text-xs text-muted">{o.d}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {serverError && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{serverError}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>Ləğv et</Button>
            <Button
              variant={mode === "replace" && existingCount ? "danger" : "primary"}
              disabled={!ready}
              loading={busy && !confirmReplace}
              onClick={() => (mode === "replace" && existingCount ? setConfirmReplace(true) : void submit())}
            >
              {rows.length ? `${rows.length} bloku idxal et` : "İdxal et"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmReplace}
        onOpenChange={setConfirmReplace}
        title="Mövcud bloklar əvəz edilsin?"
        confirmLabel="Bəli, əvəz et"
        loading={busy}
        onConfirm={() => void submit()}
      >
        Dərsdəki <strong>{existingCount} blok silinəcək</strong> və yerinə {rows.length} yeni blok yazılacaq. Tələbələrin silinən bloklardakı cavabları,
        nəticələri və təkrar kartları da itəcək. Bu əməliyyatı geri qaytarmaq olmur.
      </ConfirmModal>
    </>
  );
}

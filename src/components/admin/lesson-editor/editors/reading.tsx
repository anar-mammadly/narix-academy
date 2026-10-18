"use client";

import type {
  CalloutContent, ChecklistContent, CodeContent, ExampleContent, HeadingContent, KeyTermsContent, NoteContent,
  ObjectivesContent, StepperContent, SummaryContent, TextContent,
} from "@/types/blocks";
import { cn } from "@/lib/utils";
import { uid } from "../block-meta";
import type { EditorProps } from "../types";
import { ListEditor, MarkdownHint, Segmented, SelectField, StringListEditor, TextField } from "./fields";
import { useId, useRef } from "react";
import { Input, Label, Textarea } from "@/components/ui/Input";

export function HeadingEditor({ value, onChange }: EditorProps<HeadingContent>) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <TextField label="Başlıq mətni" required value={value.text} onChange={(text) => onChange({ ...value, text })} placeholder="Məs.: Test case-in strukturu" />
      <Segmented
        label="Səviyyə"
        value={value.level ?? 2}
        onChange={(level) => onChange({ ...value, level })}
        options={[
          { value: 2, label: "H2", ariaLabel: "Böyük başlıq (H2)" },
          { value: 3, label: "H3", ariaLabel: "Orta başlıq (H3)" },
          { value: 4, label: "H4", ariaLabel: "Kiçik başlıq (H4)" },
        ]}
      />
    </div>
  );
}

export function TextEditor({ value, onChange }: EditorProps<TextContent>) {
  return (
    <div className="space-y-4">
      <div>
        <TextField label="Mətn" multiline rows={6} value={value.body} onChange={(body) => onChange({ ...value, body })} placeholder="Mətni bura yazın…" />
        <p className="mt-1.5 text-xs text-muted"><MarkdownHint /></p>
      </div>
      <Segmented
        label="Fon"
        value={value.highlight ?? "normal"}
        onChange={(highlight) => onChange({ ...value, highlight })}
        options={[
          { value: "normal", label: "Adi" },
          { value: "info", label: "Məlumat" },
          { value: "success", label: "Uğur" },
          { value: "warning", label: "Xəbərdarlıq" },
        ]}
      />
    </div>
  );
}

export function ObjectivesEditor({ value, onChange }: EditorProps<ObjectivesContent>) {
  return (
    <StringListEditor
      label="Məqsədlər"
      items={value.items}
      onChange={(items) => onChange({ ...value, items })}
      itemLabel={(i) => `Məqsəd ${i + 1}`}
      addLabel="Məqsəd əlavə et"
      placeholder="Məs.: Smoke və sanity testi fərqləndirmək"
    />
  );
}

export function SummaryEditor({ value, onChange }: EditorProps<SummaryContent>) {
  return (
    <StringListEditor
      label="Əsas fikirlər"
      items={value.points}
      onChange={(points) => onChange({ ...value, points })}
      itemLabel={(i) => `Fikir ${i + 1}`}
      addLabel="Fikir əlavə et"
    />
  );
}

export function KeyTermsEditor({ value, onChange }: EditorProps<KeyTermsContent>) {
  return (
    <ListEditor
      label="Terminlər"
      items={value.terms}
      onChange={(terms) => onChange({ ...value, terms })}
      create={() => ({ term: "", az: "", definition: "" })}
      min={1}
      itemLabel={(i) => `Termin ${i + 1}`}
      addLabel="Termin əlavə et"
      render={(t, update) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Termin" required value={t.term} onChange={(term) => update({ ...t, term })} placeholder="Regression testing" />
          <TextField label="Azərbaycanca" value={t.az} onChange={(az) => update({ ...t, az })} placeholder="Reqressiya testi" />
          <TextField label="İzah" required multiline rows={2} className="sm:col-span-2" value={t.definition} onChange={(definition) => update({ ...t, definition })} />
        </div>
      )}
    />
  );
}

export function ExampleEditor({ value, onChange }: EditorProps<ExampleContent>) {
  return (
    <div className="space-y-4">
      <TextField label="Nümunə" multiline rows={5} value={value.description} onChange={(description) => onChange({ ...value, description })} placeholder="Real situasiyanı təsvir edin…" />
      <TextField label="Nəticə (nə öyrəndik)" value={value.takeaway} onChange={(takeaway) => onChange({ ...value, takeaway })} placeholder="Qısa nəticə" />
    </div>
  );
}

const NOTE_VARIANTS: { value: NoteContent["variant"]; label: string }[] = [
  { value: "tip", label: "💡 Məsləhət" },
  { value: "important", label: "⚠️ Vacib" },
  { value: "warning", label: "🔶 Diqqət" },
  { value: "remember", label: "📌 Yadda saxla" },
];

export function NoteEditor({ value, onChange }: EditorProps<NoteContent>) {
  return (
    <div className="space-y-4">
      <Segmented label="Növ" value={value.variant} onChange={(variant) => onChange({ ...value, variant })} options={NOTE_VARIANTS} />
      <TextField label="Mətn" multiline rows={3} value={value.body} onChange={(body) => onChange({ ...value, body })} />
    </div>
  );
}

const CALLOUT_COLORS: { value: CalloutContent["color"]; label: string; swatch: string }[] = [
  { value: "blue", label: "Göy", swatch: "bg-sky-bright" },
  { value: "green", label: "Yaşıl", swatch: "bg-pass-bright" },
  { value: "yellow", label: "Sarı", swatch: "bg-xp-bright" },
  { value: "red", label: "Qırmızı", swatch: "bg-bug-bright" },
  { value: "purple", label: "Bənövşəyi", swatch: "bg-iris" },
];

export function CalloutEditor({ value, onChange }: EditorProps<CalloutContent>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[6rem_1fr]">
        <TextField label="Emoji" value={value.emoji} onChange={(emoji) => onChange({ ...value, emoji })} placeholder="💡" />
        <TextField label="Başlıq" value={value.title} onChange={(title) => onChange({ ...value, title })} />
      </div>
      <TextField label="Mətn" multiline rows={3} value={value.body} onChange={(body) => onChange({ ...value, body })} />
      <Segmented
        label="Rəng"
        value={value.color}
        onChange={(color) => onChange({ ...value, color })}
        options={CALLOUT_COLORS.map((c) => ({
          value: c.value,
          ariaLabel: c.label,
          label: <><span aria-hidden className={cn("h-3.5 w-3.5 rounded-full", c.swatch)} /><span className="hidden xs:inline">{c.label}</span></>,
        }))}
      />
    </div>
  );
}

export function StepperEditor({ value, onChange }: EditorProps<StepperContent>) {
  return (
    <ListEditor
      label="Addımlar"
      items={value.steps}
      onChange={(steps) => onChange({ ...value, steps })}
      create={() => ({ title: "", description: "" })}
      min={1}
      itemLabel={(i) => `Addım ${i + 1}`}
      addLabel="Addım əlavə et"
      render={(s, update) => (
        <div className="space-y-3">
          <TextField label="Başlıq" required value={s.title} onChange={(title) => update({ ...s, title })} />
          <TextField label="Təsvir" multiline rows={2} value={s.description} onChange={(description) => update({ ...s, description })} />
        </div>
      )}
    />
  );
}

const LANGUAGES = ["javascript", "typescript", "json", "html", "css", "bash", "python", "java", "sql", "http", "yaml", "text"];

export function CodeEditor({ value, onChange }: EditorProps<CodeContent>) {
  const id = useId();
  const tabEscaped = useRef(false);
  const options = LANGUAGES.includes(value.language) ? LANGUAGES : [value.language, ...LANGUAGES];
  return (
    <div className="space-y-4">
      <SelectField label="Dil" value={value.language} onChange={(language) => onChange({ ...value, language })} options={options.map((l) => ({ value: l, label: l }))} className="max-w-56" />
      <div>
        <Label htmlFor={id}>Kod</Label>
        <Textarea
          id={id}
          aria-describedby={`${id}-hint`}
          rows={10}
          spellCheck={false}
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              tabEscaped.current = true;
              return;
            }
            // Tab indents; after Esc, Tab moves focus as usual (no keyboard trap).
            if (e.key === "Tab" && !e.shiftKey && !tabEscaped.current) {
              e.preventDefault();
              const el = e.currentTarget;
              const { selectionStart: start, selectionEnd: end } = el;
              onChange({ ...value, code: value.code.slice(0, start) + "  " + value.code.slice(end) });
              requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
              return;
            }
            tabEscaped.current = false;
          }}
          className="bg-code-bg font-mono text-sm leading-relaxed text-code-ink"
        />
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">Tab iki boşluq əlavə edir. Sahədən çıxmaq üçün əvvəlcə Esc, sonra Tab basın.</p>
      </div>
      <TextField label="İzah (istəyə bağlı)" value={value.caption} onChange={(caption) => onChange({ ...value, caption })} />
    </div>
  );
}

export function ChecklistEditor({ value, onChange }: EditorProps<ChecklistContent>) {
  return (
    <ListEditor
      label="Bəndlər"
      items={value.items}
      onChange={(items) => onChange({ ...value, items })}
      create={() => ({ id: uid("c"), text: "" })}
      getKey={(it) => it.id}
      min={1}
      itemLabel={(i) => `Bənd ${i + 1}`}
      addLabel="Bənd əlavə et"
      render={(it, update, i) => <Input aria-label={`Bənd ${i + 1}`} value={it.text} onChange={(e) => update({ ...it, text: e.target.value })} />}
    />
  );
}

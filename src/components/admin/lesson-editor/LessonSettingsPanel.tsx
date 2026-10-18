"use client";

import { useId } from "react";
import { Wand2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Input, Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "../Switch";
import type { ModuleOption } from "./types";

export type SettingsDraft = {
  title: string;
  slug: string;
  shortDescription: string;
  estimatedMinutes: string;
  minQuizScore: string;
  published: boolean;
  moduleId: string;
};

export type SettingsErrors = Partial<Record<keyof SettingsDraft, string>>;

export function validateSettings(d: SettingsDraft): SettingsErrors {
  const e: SettingsErrors = {};
  if (!d.title.trim()) e.title = "Başlıq tələb olunur";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug.trim())) e.slug = "Yalnız kiçik latın hərfləri, rəqəm və “-”";
  const min = Number(d.estimatedMinutes);
  if (!Number.isInteger(min) || min < 1 || min > 600) e.estimatedMinutes = "1–600 arası tam ədəd";
  if (d.minQuizScore.trim() !== "") {
    const s = Number(d.minQuizScore);
    if (!Number.isInteger(s) || s < 0 || s > 100) e.minQuizScore = "0–100 arası tam ədəd";
  }
  if (!d.moduleId) e.moduleId = "Modul seçin";
  return e;
}

export function LessonSettingsPanel({
  draft, onChange, errors, modules, dirty, saving, serverError, onSave, onReset, stats,
}: {
  draft: SettingsDraft;
  onChange: (d: SettingsDraft) => void;
  errors: SettingsErrors;
  modules: ModuleOption[];
  dirty: boolean;
  saving: boolean;
  serverError: string | null;
  onSave: () => void;
  onReset: () => void;
  stats: { blocks: number; interactive: number; xp: number };
}) {
  const moduleId = useId();
  const set = <K extends keyof SettingsDraft>(k: K, v: SettingsDraft[K]) => onChange({ ...draft, [k]: v });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      noValidate
    >
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { k: "Blok", v: stats.blocks },
          { k: "İnteraktiv", v: stats.interactive },
          { k: "Maks. XP", v: stats.xp },
        ].map((s) => (
          <div key={s.k} className="rounded-lg bg-surface-2 px-2 py-2.5">
            <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-muted">{s.k}</dt>
            <dd className="font-display text-lg font-semibold text-ink">{s.v}</dd>
          </div>
        ))}
      </dl>

      <Switch
        label="Yayımlanıb"
        hint={draft.published ? "Tələbələr bu dərsi görür." : "Qaralama — yalnız siz görürsünüz."}
        checked={draft.published}
        onCheckedChange={(v) => set("published", v)}
      />

      <Field label="Başlıq *" error={errors.title}>
        {(p) => <Input {...p} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />}
      </Field>

      <Field label="Slug (URL)" error={errors.slug} hint={`/learn/${draft.slug || "…"}`}>
        {(p) => (
          <div className="flex gap-2">
            <Input {...p} value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} className="font-mono text-sm" spellCheck={false} />
            <Button variant="secondary" size="icon" aria-label="Slug-u başlıqdan yarat" title="Başlıqdan yarat" onClick={() => set("slug", slugify(draft.title))}>
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Field>

      <Field label="Qısa təsvir" hint="Dərs kartında və öyrənmə yolunda görünür.">
        {(p) => <Textarea {...p} rows={3} value={draft.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={500} />}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Müddət (dəq)" error={errors.estimatedMinutes}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={600} value={draft.estimatedMinutes} onChange={(e) => set("estimatedMinutes", e.target.value)} />}
        </Field>
        <Field label="Keçid balı (%)" error={errors.minQuizScore} hint={errors.minQuizScore ? undefined : "Boş: standart"}>
          {(p) => <Input {...p} type="number" inputMode="numeric" min={0} max={100} placeholder="70" value={draft.minQuizScore} onChange={(e) => set("minQuizScore", e.target.value)} />}
        </Field>
      </div>

      <div>
        <Label htmlFor={moduleId}>Modul</Label>
        <Select id={moduleId} value={draft.moduleId} onValueChange={(v) => set("moduleId", v)} options={modules.map((m) => ({ value: m.id, label: m.title }))} />
        {errors.moduleId && <p className="mt-1.5 text-sm text-bug">{errors.moduleId}</p>}
      </div>

      {serverError && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{serverError}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" block loading={saving} disabled={!dirty}>
          {dirty ? "Parametrləri saxla" : "Saxlanılıb"}
        </Button>
        {dirty && <Button variant="ghost" onClick={onReset} disabled={saving}>Geri qaytar</Button>}
      </div>
    </form>
  );
}

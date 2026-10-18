"use client";

import { MODULE_ICONS } from "@/app/api/modules/schema";
import { ModuleIcon } from "@/components/game/ModuleIcon";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Switch } from "./Switch";

export type ModuleDraft = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  published: boolean;
  icon: string;
  coverColor: string;
};

const ICON_LABEL: Record<string, string> = {
  BookOpen: "Kitab", Bot: "Robot", Bug: "Baq", ClipboardList: "Siyahı", FileCheck2: "Yoxlanmış sənəd",
  Layers: "Qatlar", PenTool: "Qələm", Sparkles: "Parıltı", Workflow: "Proses", Wrench: "Alət",
};

export const MODULE_COLORS = ["#5b4bff", "#0a83c4", "#0faa78", "#e85d00", "#e8334f", "#b86e00", "#8b3dff", "#14152b"];

const COLOR_LABEL: Record<string, string> = {
  "#5b4bff": "İris", "#0a83c4": "Göy", "#0faa78": "Yaşıl", "#e85d00": "Narıncı",
  "#e8334f": "Qırmızı", "#b86e00": "Kəhrəba", "#8b3dff": "Bənövşəyi", "#14152b": "Tünd",
};

export function emptyModule(): ModuleDraft {
  return { title: "", titleEn: "", description: "", descriptionEn: "", published: false, icon: "BookOpen", coverColor: MODULE_COLORS[0] };
}

export function moduleBody(d: ModuleDraft) {
  return {
    title: d.title.trim(),
    titleEn: d.titleEn.trim() || null,
    description: d.description.trim() || null,
    descriptionEn: d.descriptionEn.trim() || null,
    published: d.published,
    icon: (MODULE_ICONS as readonly string[]).includes(d.icon) ? d.icon : undefined,
    coverColor: /^#[0-9a-fA-F]{6}$/.test(d.coverColor) ? d.coverColor : undefined,
  };
}

export function ModuleFields({ value, onChange, titleError }: { value: ModuleDraft; onChange: (d: ModuleDraft) => void; titleError?: string }) {
  const set = <K extends keyof ModuleDraft>(k: K, v: ModuleDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Başlıq (AZ) *" error={titleError}>
          {(p) => <Input {...p} value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="Məs.: Test dizayn texnikaları" maxLength={200} />}
        </Field>
        <Field label="Başlıq (EN)">
          {(p) => <Input {...p} value={value.titleEn} onChange={(e) => set("titleEn", e.target.value)} placeholder="Test design techniques" maxLength={200} />}
        </Field>
      </div>
      <Field label="Təsvir (AZ)">
        {(p) => <Textarea {...p} rows={3} value={value.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} />}
      </Field>
      <Field label="Təsvir (EN)">
        {(p) => <Textarea {...p} rows={3} value={value.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} maxLength={2000} />}
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">İkon</legend>
        <div className="flex flex-wrap gap-2">
          {MODULE_ICONS.map((icon) => {
            const active = value.icon === icon;
            return (
              <label
                key={icon}
                className={cn(
                  "grid h-11 w-11 cursor-pointer place-items-center rounded-lg border transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-iris",
                  active ? "border-iris bg-iris-soft text-iris-ink" : "border-line text-ink-2 hover:border-line-strong"
                )}
              >
                <input type="radio" name="module-icon" value={icon} checked={active} onChange={() => set("icon", icon)} className="sr-only" aria-label={`İkon: ${ICON_LABEL[icon] ?? icon}`} />
                <ModuleIcon name={icon} className="h-5 w-5" />
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Rəng</legend>
        <div className="flex flex-wrap gap-2">
          {MODULE_COLORS.map((c) => {
            const active = value.coverColor.toLowerCase() === c;
            return (
              <label
                key={c}
                className={cn(
                  "grid h-9 w-9 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-surface has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-iris",
                  active && "ring-2 ring-ink"
                )}
                style={{ backgroundColor: c }}
              >
                <input type="radio" name="module-color" value={c} checked={active} onChange={() => set("coverColor", c)} className="sr-only" aria-label={`Rəng: ${COLOR_LABEL[c] ?? c}`} />
              </label>
            );
          })}
        </div>
      </fieldset>

      <Switch
        label="Yayımlanıb"
        hint={value.published ? "Modul tələbələrə görünür (yalnız yayımlanmış dərsləri ilə)." : "Qaralama — tələbələr görmür."}
        checked={value.published}
        onCheckedChange={(v) => set("published", v)}
      />
    </div>
  );
}

/** Small coloured icon tile used in module lists. */
export function ModuleBadge({ icon, color, className }: { icon: string; color: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white", className)} style={{ backgroundColor: color }}>
      <ModuleIcon name={icon} className="h-5 w-5" />
    </span>
  );
}

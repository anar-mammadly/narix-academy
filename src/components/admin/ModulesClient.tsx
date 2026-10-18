"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, ExternalLink, Layers, Pencil, Plus, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { ModuleBadge } from "./ModuleForm";
import { SortableList } from "./SortableList";

export type ModuleListItem = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  icon: string;
  color: string;
  lessons: { id: string; title: string; published: boolean; minutes: number; blocks: number }[];
};

export function ModulesClient({ modules: initial }: { modules: ModuleListItem[] }) {
  const [modules, setModules] = useState(initial);

  if (modules.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="Hələ modul yoxdur"
        description="İlk modulu yaradın, sonra ona dərslər əlavə edin."
        action={<Link href="/admin/modules/new" className={buttonStyles()}><Plus className="h-4 w-4" aria-hidden /> Modul yarat</Link>}
      />
    );
  }

  return (
    <SortableList
      items={modules}
      onItemsChange={setModules}
      endpoint="/api/modules"
      itemName={(m, i) => `Modul ${i + 1}: ${m.title}`}
      className="space-y-4"
      render={(m, i, handle) => (
        <article className="rounded-xl border border-line bg-surface" aria-labelledby={`mod-${m.id}`}>
          <header className="flex items-start gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="pt-0.5">{handle}</div>
            <ModuleBadge icon={m.icon} color={m.color} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs font-semibold text-muted">Modul {i + 1}</span>
                <Badge tone={m.published ? "pass" : "neutral"}>{m.published ? "Yayımlanıb" : "Qaralama"}</Badge>
              </div>
              <h2 id={`mod-${m.id}`} className="mt-0.5 break-words font-display text-base font-semibold text-ink">{m.title}</h2>
              {m.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{m.description}</p>}
            </div>
            <Link href={`/admin/modules/${m.id}/edit`} className={buttonStyles({ variant: "secondary", size: "sm", className: "shrink-0" })}>
              <Settings2 className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">İdarə et</span><span className="sr-only sm:hidden">“{m.title}” modulunu idarə et</span>
            </Link>
          </header>

          {m.lessons.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line">
              {m.lessons.map((l, j) => (
                <li key={l.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                  <span className="w-9 shrink-0 text-xs font-semibold tabular-nums text-muted">{i + 1}.{j + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/lessons/${l.id}/edit`} className={cn("block truncate text-sm font-medium hover:text-iris", l.published ? "text-ink" : "text-ink-2")}>
                      {l.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" aria-hidden /> {l.blocks} blok</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden /> {l.minutes} dəq</span>
                      {!l.published && <Badge className="px-2 py-0 text-[0.7rem]">Qaralama</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Tooltip label="Önizlə">
                      <a href={`/preview/${l.id}`} target="_blank" rel="noopener noreferrer" aria-label={`“${l.title}” dərsini önizlə (yeni pəncərə)`} className={buttonStyles({ variant: "ghost", size: "icon-sm" })}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Tooltip>
                    <Tooltip label="Redaktə et">
                      <Link href={`/admin/lessons/${l.id}/edit`} aria-label={`“${l.title}” dərsini redaktə et`} className={buttonStyles({ variant: "ghost", size: "icon-sm" })}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm text-muted">
              Bu modulda hələ dərs yoxdur.
              <Link href={`/admin/modules/${m.id}/edit?new=1`} className={buttonStyles({ variant: "soft", size: "sm" })}><Plus className="h-4 w-4" aria-hidden /> Dərs əlavə et</Link>
            </div>
          )}
        </article>
      )}
    />
  );
}


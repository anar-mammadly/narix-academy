"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { BlockType } from "@/types/blocks";
import { BLOCK_XP } from "@/lib/game";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { BLOCK_META, GROUPS, TYPES_BY_GROUP } from "./block-meta";

const toneTile: Record<string, string> = {
  neutral: "bg-surface-2 text-ink-2", iris: "bg-iris-soft text-iris-ink", pass: "bg-pass-soft text-pass", bug: "bg-bug-soft text-bug",
  xp: "bg-xp-soft text-xp", sky: "bg-sky-soft text-sky", flame: "bg-flame-soft text-flame",
};

export function AddBlockPicker({
  open, onOpenChange, onPick, busyType,
}: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (type: BlockType) => void; busyType: BlockType | null }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("az");

  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({
        ...g,
        types: TYPES_BY_GROUP[g.id].filter((t) => {
          if (!q) return true;
          const m = BLOCK_META[t];
          return `${m.label} ${m.description} ${t}`.toLocaleLowerCase("az").includes(q);
        }),
      })).filter((g) => g.types.length),
    [q]
  );

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery("");
      }}
      title="Blok əlavə et"
      description="Dərsə hansı növ məzmun əlavə edirsiniz?"
      className="sm:max-w-3xl"
    >
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input
          type="search"
          aria-label="Blok növü axtar"
          placeholder="Axtar: quiz, video, cədvəl…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`grp-${g.id}`}>
            <div className="mb-2 flex items-baseline gap-2">
              <h3 id={`grp-${g.id}`} className="font-display text-sm font-semibold text-ink">{g.label}</h3>
              <span className="text-xs text-muted">{g.description}</span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.types.map((t) => {
                const m = BLOCK_META[t];
                const Icon = m.icon;
                const xp = BLOCK_XP[t];
                return (
                  <li key={t}>
                    <button
                      type="button"
                      disabled={busyType !== null}
                      aria-busy={busyType === t || undefined}
                      onClick={() => onPick(t)}
                      className={cn(
                        "flex h-full w-full items-start gap-3 rounded-lg border border-line bg-surface p-3 text-left transition-[border-color,background-color] hover:border-iris/50 hover:bg-iris-soft/40 disabled:opacity-60",
                        busyType === t && "border-iris bg-iris-soft/60"
                      )}
                    >
                      <span aria-hidden className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", toneTile[m.tone])}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-ink">{m.label}</span>
                          {xp ? <span className="rounded-full bg-xp-soft px-1.5 text-[0.7rem] font-semibold text-xp">+{xp} XP</span> : null}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted">{m.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {groups.length === 0 && <p className="py-6 text-center text-sm text-muted">“{query}” üzrə blok tapılmadı.</p>}
      </div>
    </Modal>
  );
}

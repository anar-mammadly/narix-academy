"use client";

import { RelativeTime } from "@/components/ui/RelativeTime";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Search, UserPlus, Users, Zap } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { buttonStyles } from "@/components/ui/Button";
import { Table, TableBody, TableHead, TableRow, TableTd, TableTh } from "@/components/ui/Table";
import { cn, formatNumber } from "@/lib/utils";
import type { StudentRow } from "./student-stats";

type Filter = "all" | "active" | "inactive";
type Sort = "name" | "progress" | "xp" | "last";

const WEEK = 7 * 24 * 60 * 60 * 1000;

function lastLabel(iso: string | null) {
  return iso ? <RelativeTime iso={iso} /> : "Heç vaxt";
}

function isInactive(r: StudentRow, now: number) {
  return !r.lastActive || now - new Date(r.lastActive).getTime() > WEEK;
}

function Streak({ n }: { n: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", n > 0 ? "text-flame" : "text-muted")}>
      <Flame className="h-4 w-4" aria-hidden /> {n}<span className="sr-only"> gün ardıcıl</span>
    </span>
  );
}

function Xp({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-ink">
      <Zap className="h-4 w-4 fill-xp-bright text-xp-bright" aria-hidden /> {formatNumber(n)}<span className="sr-only"> XP</span>
    </span>
  );
}

export function StudentsClient({ rows, totalLessons, initialFilter }: { rows: StudentRow[]; totalLessons: number; initialFilter: Filter }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [sort, setSort] = useState<Sort>("name");
  const [now] = useState(() => Date.now());

  const counts = useMemo(() => {
    const inactive = rows.filter((r) => isInactive(r, now)).length;
    return { all: rows.length, inactive, active: rows.length - inactive };
  }, [rows, now]);

  const list = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("az");
    return rows
      .filter((r) => !q || r.name.toLocaleLowerCase("az").includes(q) || r.email.toLowerCase().includes(q))
      .filter((r) => filter === "all" || (filter === "inactive") === isInactive(r, now))
      .sort((a, b) => {
        if (sort === "progress") return b.progress - a.progress;
        if (sort === "xp") return b.xp - a.xp;
        if (sort === "last") return (b.lastActive ?? "").localeCompare(a.lastActive ?? "");
        return a.name.localeCompare(b.name, "az");
      });
  }, [rows, query, filter, sort, now]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title="Hələ tələbə yoxdur"
        description="İlk tələbəni əlavə edin, giriş məlumatlarını ona göndərin."
        action={<Link href="/admin/students/new" className={buttonStyles()}><UserPlus className="h-4 w-4" aria-hidden /> Tələbə əlavə et</Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" aria-label="Tələbə axtar" placeholder="Ad və ya e-poçt…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            label="Filtr"
            value={filter}
            onValueChange={(v) => setFilter(v as Filter)}
            items={[
              { value: "all", label: "Hamısı", count: counts.all },
              { value: "active", label: "Aktiv", count: counts.active },
              { value: "inactive", label: "Passiv", count: counts.inactive },
            ]}
          />
          <Select
            aria-label="Sıralama"
            value={sort}
            onValueChange={(v) => setSort(v as Sort)}
            className="w-44"
            options={[
              { value: "name", label: "Ad üzrə" },
              { value: "progress", label: "İrəliləyiş üzrə" },
              { value: "xp", label: "XP üzrə" },
              { value: "last", label: "Son aktivlik" },
            ]}
          />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{list.length} tələbə göstərilir</p>

      {list.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Uyğun tələbə tapılmadı" description="Axtarışı və ya filtri dəyişin." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableTh>Tələbə</TableTh>
                  <TableTh>İrəliləyiş</TableTh>
                  <TableTh>XP</TableTh>
                  <TableTh>Səviyyə</TableTh>
                  <TableTh>Seriya</TableTh>
                  <TableTh>Son aktivlik</TableTh>
                </tr>
              </TableHead>
              <TableBody className="bg-surface">
                {list.map((r) => (
                  <TableRow key={r.id} className="align-middle hover:bg-surface-2/60">
                    <TableTd className="min-w-56">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} src={r.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-ink">{r.name}</div>
                          <div className="truncate text-xs text-muted">{r.email}</div>
                        </div>
                      </div>
                    </TableTd>
                    <TableTd className="min-w-44">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={r.progress} size="sm" tone="pass" label={`${r.name}: irəliləyiş`} className="w-24" />
                        <span className="tabular-nums text-ink">{r.progress}%</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted">{r.completed}/{totalLessons} dərs</div>
                    </TableTd>
                    <TableTd className="min-w-24"><Xp n={r.xp} /></TableTd>
                    <TableTd className="min-w-32">
                      <Badge tone="iris">Səv. {r.level}</Badge>
                      <div className="mt-0.5 text-xs text-muted">{r.levelTitle}</div>
                    </TableTd>
                    <TableTd className="min-w-20"><Streak n={r.streak} /></TableTd>
                    <TableTd className={cn("min-w-32 whitespace-nowrap", isInactive(r, now) && "text-flame")}>{lastLabel(r.lastActive)}</TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2.5 md:hidden">
            {list.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} src={r.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{r.name}</div>
                    <div className="truncate text-xs text-muted">{r.email}</div>
                  </div>
                  <Badge tone="iris" className="shrink-0">Səv. {r.level}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={r.progress} size="sm" tone="pass" label={`${r.name}: irəliləyiş`} />
                  <span className="shrink-0 text-sm tabular-nums text-ink">{r.progress}%</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <Xp n={r.xp} />
                  <Streak n={r.streak} />
                  <span className={cn("ml-auto text-xs", isInactive(r, now) ? "font-medium text-flame" : "text-muted")}>{lastLabel(r.lastActive)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

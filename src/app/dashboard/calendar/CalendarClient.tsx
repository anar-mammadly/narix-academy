"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, FileWarning, Sparkles, Video, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import {
  AZ_MONTHS, AZ_WEEKDAYS, AZ_WEEKDAYS_SHORT, addDays, dayKey, daysInMonth, formatAzDate, formatAzTime,
  formatKey, makeKey, parseKey, weekdayIndex,
} from "./az-date";

export type EventType = "CLASS" | "EXAM" | "DEADLINE" | "OTHER";

export type CalendarEventView = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  type: EventType;
  meetLink: string | null;
};

const TYPE: Record<EventType, { label: string; tone: BadgeTone; dot: string; tile: string; icon: LucideIcon }> = {
  CLASS: { label: "Dərs", tone: "iris", dot: "bg-iris", tile: "bg-iris-soft text-iris-ink", icon: BookOpen },
  EXAM: { label: "İmtahan", tone: "bug", dot: "bg-bug", tile: "bg-bug-soft text-bug", icon: FileWarning },
  DEADLINE: { label: "Son tarix", tone: "xp", dot: "bg-xp-bright", tile: "bg-xp-soft text-xp", icon: Clock },
  OTHER: { label: "Digər", tone: "sky", dot: "bg-sky", tile: "bg-sky-soft text-sky", icon: Sparkles },
};

const plural = (n: number) => `${n} tədbir`;

export default function CalendarClient({ events, now, todayKey }: { events: CalendarEventView[]; now: string; todayKey: string }) {
  const [selected, setSelected] = useState(todayKey);
  const [cursor, setCursor] = useState(() => {
    const { y, m } = parseKey(todayKey);
    return { y, m };
  });
  const gridRef = useRef<HTMLDivElement>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEventView[]>();
    for (const e of events) {
      const k = dayKey(e.startAt);
      const list = map.get(k);
      if (list) list.push(e);
      else map.set(k, [e]);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(() => {
    const t = new Date(now).getTime();
    return events.filter((e) => new Date(e.endAt ?? e.startAt).getTime() >= t).slice(0, 5);
  }, [events, now]);

  function select(key: string, focus = false) {
    setSelected(key);
    const { y, m } = parseKey(key);
    setCursor({ y, m });
    if (focus) {
      requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-key="${key}"]`)?.focus());
    }
  }

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(cursor.y, cursor.m + delta, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    setCursor({ y, m });
    // Keep the selection inside the visible month.
    const sel = parseKey(selected);
    setSelected(makeKey(y, m, Math.min(sel.d, daysInMonth(y, m))));
  }

  // Month grid cells (Monday-first), including the tail of the previous and head of the next month.
  const cells = useMemo(() => {
    const first = makeKey(cursor.y, cursor.m, 1);
    const lead = weekdayIndex(first);
    const total = Math.ceil((lead + daysInMonth(cursor.y, cursor.m)) / 7) * 7;
    return Array.from({ length: total }, (_, i) => addDays(first, i - lead));
  }, [cursor]);

  const weekStart = addDays(selected, -weekdayIndex(selected));
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function onGridKey(e: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in step) {
      e.preventDefault();
      select(addDays(selected, step[e.key]), true);
    } else if (e.key === "Home") {
      e.preventDefault();
      select(addDays(selected, -weekdayIndex(selected)), true);
    } else if (e.key === "End") {
      e.preventDefault();
      select(addDays(selected, 6 - weekdayIndex(selected)), true);
    }
  }

  const dayEvents = byDay.get(selected) ?? [];
  const { y: selY, m: selM } = parseKey(selected);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-w-0 content-start gap-5">
        <Card padding="sm" className="sm:p-5">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink" aria-live="polite">
              <span className="md:hidden">{AZ_MONTHS[selM]} {selY}</span>
              <span className="hidden md:inline">{AZ_MONTHS[cursor.m]} {cursor.y}</span>
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => select(todayKey)} disabled={selected === todayKey}>Bu gün</Button>
              {/* Phones: step by week. Larger screens: by month. */}
              <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => select(addDays(selected, -7))} aria-label="Əvvəlki həftə">
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => select(addDays(selected, 7))} aria-label="Növbəti həftə">
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon-sm" className="hidden md:inline-flex" onClick={() => shiftMonth(-1)} aria-label="Əvvəlki ay">
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="icon-sm" className="hidden md:inline-flex" onClick={() => shiftMonth(1)} aria-label="Növbəti ay">
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          {/* Week strip (phones) */}
          <div className="grid grid-cols-7 gap-1 md:hidden" role="group" aria-label="Həftə">
            {week.map((k, i) => {
              const count = byDay.get(k)?.length ?? 0;
              const isSel = k === selected;
              const isToday = k === todayKey;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => select(k)}
                  aria-pressed={isSel}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${AZ_WEEKDAYS[i]}, ${formatKey(k)}${count ? `, ${plural(count)}` : ""}`}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 rounded-lg py-2 text-xs transition-colors",
                    isSel ? "bg-iris text-white" : "text-ink-2 hover:bg-surface-2",
                    !isSel && isToday && "ring-2 ring-inset ring-iris"
                  )}
                >
                  <span className={cn("font-medium", isSel ? "text-white/80" : "text-muted")} aria-hidden>{AZ_WEEKDAYS_SHORT[i]}</span>
                  <span className="font-display text-base font-semibold" aria-hidden>{parseKey(k).d}</span>
                  <Dots events={byDay.get(k)} inverted={isSel} />
                </button>
              );
            })}
          </div>

          {/* Month grid (tablet and up) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden>
              {AZ_WEEKDAYS_SHORT.map((d, i) => (
                <abbr key={d} title={AZ_WEEKDAYS[i]} className="py-1 text-center text-xs font-semibold uppercase text-muted no-underline">{d}</abbr>
              ))}
            </div>
            <div ref={gridRef} role="group" aria-label={`${AZ_MONTHS[cursor.m]} ${cursor.y}`} onKeyDown={onGridKey} className="grid grid-cols-7 gap-1">
              {cells.map((k) => {
                const { m, d } = parseKey(k);
                const inMonth = m === cursor.m;
                const list = byDay.get(k);
                const isSel = k === selected;
                const isToday = k === todayKey;
                return (
                  <button
                    key={k}
                    data-key={k}
                    type="button"
                    tabIndex={isSel ? 0 : -1}
                    onClick={() => select(k)}
                    aria-pressed={isSel}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${AZ_WEEKDAYS[weekdayIndex(k)]}, ${formatKey(k, true)}${list ? `, ${plural(list.length)}` : ""}`}
                    className={cn(
                      "flex aspect-[4/3] min-h-16 flex-col items-start justify-between rounded-lg border p-2 text-left transition-colors",
                      isSel ? "border-iris bg-iris-soft" : "border-transparent hover:bg-surface-2",
                      !inMonth && "opacity-45"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 min-w-7 place-items-center rounded-full px-1 text-sm font-semibold",
                        isToday ? "bg-iris text-white" : isSel ? "text-iris-ink" : "text-ink"
                      )}
                    >
                      {d}
                    </span>
                    <Dots events={list} />
                  </button>
                );
              })}
            </div>
          </div>

          <Legend />
        </Card>

        {/* Agenda for selected day */}
        <section aria-labelledby="agenda-title">
          <h2 id="agenda-title" className="mb-3 font-display text-base font-semibold text-ink">
            {selected === todayKey ? "Bu gün" : AZ_WEEKDAYS[weekdayIndex(selected)]}, {formatKey(selected)}
          </h2>
          {dayEvents.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-6 w-6" aria-hidden />} title="Bu gün üçün tədbir yoxdur" className="py-10" />
          ) : (
            <ul className="grid gap-3">
              {dayEvents.map((e) => <li key={e.id}><EventCard event={e} now={now} /></li>)}
            </ul>
          )}
        </section>
      </div>

      <aside aria-labelledby="upcoming-title" className="min-w-0">
        <h2 id="upcoming-title" className="mb-3 font-display text-base font-semibold text-ink">Yaxınlaşan</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="Planlaşdırılmış tədbir yoxdur" className="py-10" />
        ) : (
          <ul className="grid gap-2">
            {upcoming.map((e) => {
              const cfg = TYPE[e.type];
              const k = dayKey(e.startAt);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => select(k)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong hover:bg-surface-2"
                  >
                    <span className="grid w-12 shrink-0 place-items-center rounded-lg bg-surface-2 py-1.5 text-center">
                      <span className="font-display text-lg font-semibold leading-none text-ink">{parseKey(k).d}</span>
                      <span className="mt-0.5 text-[0.7rem] font-medium text-muted">{AZ_MONTHS[parseKey(k).m].slice(0, 3)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{e.title}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} aria-hidden />
                        {cfg.label} · {formatAzTime(e.startAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}

function Dots({ events, inverted }: { events?: CalendarEventView[]; inverted?: boolean }) {
  if (!events?.length) return <span className="h-1.5" aria-hidden />;
  const shown = events.slice(0, 3);
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {shown.map((e) => (
        <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", TYPE[e.type].dot, inverted && "ring-1 ring-white")} />
      ))}
      {events.length > 3 && <span className={cn("text-[0.65rem] font-semibold leading-none", inverted ? "text-white" : "text-muted")}>+{events.length - 3}</span>}
    </span>
  );
}

function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs text-muted" aria-label="Rəng izahı">
      {(Object.keys(TYPE) as EventType[]).map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full", TYPE[t].dot)} aria-hidden />
          {TYPE[t].label}
        </li>
      ))}
    </ul>
  );
}

function EventCard({ event: e, now }: { event: CalendarEventView; now: string }) {
  const cfg = TYPE[e.type];
  const Icon = cfg.icon;
  const past = new Date(e.endAt ?? e.startAt).getTime() < new Date(now).getTime();
  const time = e.endAt && dayKey(e.endAt) === dayKey(e.startAt)
    ? `${formatAzTime(e.startAt)}–${formatAzTime(e.endAt)}`
    : e.endAt
      ? `${formatAzTime(e.startAt)} – ${formatAzDate(e.endAt, false)}, ${formatAzTime(e.endAt)}`
      : formatAzTime(e.startAt);

  return (
    <Card padding="sm" className={cn("flex gap-3 sm:p-5", past && "opacity-70")}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", cfg.tile)} aria-hidden>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={cfg.tone}>{cfg.label}</Badge>
          {past && <Badge tone="neutral">Keçib</Badge>}
        </div>
        <h3 className="mt-1 break-words font-semibold text-ink">{e.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden /> <time dateTime={e.startAt}>{time}</time>
        </p>
        {e.description && <p className="mt-1.5 whitespace-pre-line break-words text-sm text-ink-2">{e.description}</p>}
        {e.meetLink && !past && (
          <a href={e.meetLink} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles({ size: "sm", variant: "soft" }), "mt-3")}>
            <Video className="h-4 w-4" aria-hidden /> Meet-ə qoşul <span className="sr-only">(yeni pəncərədə açılır)</span>
          </a>
        )}
      </div>
    </Card>
  );
}

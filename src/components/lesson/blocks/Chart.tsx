import type { ChartContent } from "@/types/blocks";

// Charts are drawn here as plain SVG from the numbers in the block, so a
// teacher can change them in the editor like any text — there is no image
// file to redraw. Colours come from the theme, so they follow light and dark.
const PALETTE = [
  "var(--c-iris)", "var(--c-sky-bright)", "var(--c-pass-bright)", "var(--c-xp-bright)",
  "var(--c-flame-bright)", "var(--c-bug-bright)",
];
const colour = (i: number) => PALETTE[i % PALETTE.length];
const fmt = (v: number, unit = "") => `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;

type Datum = ChartContent["data"][number];

function Bars({ data, unit }: { data: Datum[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="grid gap-3">
      {data.map((d, i) => (
        <li key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 font-medium text-ink">{d.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">{fmt(d.value, unit)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: colour(i) }} />
          </div>
          {d.note && <p className="mt-1 text-xs text-muted">{d.note}</p>}
        </li>
      ))}
    </ul>
  );
}

function Columns({ data, unit }: { data: Datum[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height: 200 }}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-semibold tabular-nums text-ink">{fmt(d.value, unit)}</span>
          <div className="w-full max-w-14 rounded-t-lg" style={{ height: `${Math.max(3, (d.value / max) * 76)}%`, background: colour(i) }} />
          <span className="w-full truncate text-center text-xs text-muted" title={d.label}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Line({ data, unit }: { data: Datum[]; unit?: string }) {
  const W = 600, H = 220, padX = 28, padTop = 28, padBottom = 34;
  const max = Math.max(...data.map((d) => d.value), 1);
  const x = (i: number) => padX + (i * (W - padX * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={padX} x2={W - padX} y1={y(max * t)} y2={y(max * t)} stroke="var(--c-line)" strokeWidth="1" />
      ))}
      <polygon points={`${x(0)},${y(0)} ${points} ${x(data.length - 1)},${y(0)}`} fill="var(--c-iris)" opacity="0.1" />
      <polyline points={points} fill="none" stroke="var(--c-iris)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="5" fill="var(--c-surface)" stroke="var(--c-iris)" strokeWidth="3" />
          <text x={x(i)} y={y(d.value) - 12} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--c-ink)">{fmt(d.value, unit)}</text>
          <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="12" fill="var(--c-muted)">{d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ data, unit }: { data: Datum[]; unit?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 54, C = 2 * Math.PI * R;
  // where each slice starts along the circle: the sum of the slices before it
  const slices = data.map((d, i) => ({
    length: (d.value / total) * C,
    start: (data.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * C,
  }));
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--c-line)" strokeWidth="20" />
        {slices.map((slice, i) => (
          <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={colour(i)} strokeWidth="20" strokeDasharray={`${slice.length} ${C - slice.length}`} strokeDashoffset={-slice.start} />
        ))}
      </svg>
      <ul className="grid w-full gap-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-baseline gap-2.5 text-sm">
            <span aria-hidden className="h-3 w-3 shrink-0 translate-y-0.5 rounded-sm" style={{ background: colour(i) }} />
            <span className="min-w-0 flex-1 text-ink">{d.label}{d.note && <span className="block text-xs text-muted">{d.note}</span>}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">{fmt(d.value, unit)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// First item is the narrow top, last item the wide base (as in the test pyramid).
function Pyramid({ data, unit }: { data: Datum[]; unit?: string }) {
  const n = data.length;
  return (
    <ul className="mx-auto grid w-full max-w-xl gap-1.5">
      {data.map((d, i) => {
        const width = 34 + ((i + 1) / n) * 66;
        return (
          <li key={i} className="mx-auto rounded-lg px-3 py-2.5 text-center" style={{ width: `${width}%`, background: colour(i), color: "#0b0c1d" }}>
            <span className="block text-sm font-semibold leading-tight">{d.label}</span>
            <span className="block text-xs font-medium opacity-80">{[d.value ? fmt(d.value, unit) : "", d.note].filter(Boolean).join(" · ")}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ChartBlock({ c, title }: { c: ChartContent; title?: string | null }) {
  const data = Array.isArray(c?.data) ? c.data.filter((d) => d && typeof d.value === "number") : [];
  if (data.length === 0) return null;
  const Body = { bar: Bars, columns: Columns, line: Line, donut: Donut, pyramid: Pyramid }[c.kind] ?? Bars;
  return (
    <figure className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      {title && <figcaption className="mb-4 font-display text-base font-semibold text-ink">{title}</figcaption>}
      <Body data={data} unit={c.unit} />
      {/* the same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>{title || c.caption || "Qrafik"}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}><th scope="row">{d.label}</th><td>{fmt(d.value, c.unit)}</td></tr>
          ))}
        </tbody>
      </table>
      {c.caption && <p className="mt-4 text-sm text-muted">{c.caption}</p>}
    </figure>
  );
}

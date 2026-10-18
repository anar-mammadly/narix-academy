"use client";

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle, BookMarked, Check, CheckCircle2, Copy, Flag, Info, Lightbulb, ListChecks, Pin, Target,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RichText, renderInline } from "../RichText";
import { Table, TableBody, TableHead, TableRow, TableTd, TableTh } from "@/components/ui/Table";
import type {
  CalloutContent, ChecklistContent, CodeContent, DiagramContent, ExampleContent, HeadingContent,
  ImageContent, KeyTermsContent, NoteContent, ObjectivesContent, StepperContent, SummaryContent,
  TableContent, TextContent, VideoContent,
} from "@/types/blocks";

export function slugifyHeading(text: string) {
  return "h-" + text.toLocaleLowerCase("az").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function HeadingBlock({ c }: { c: HeadingContent }) {
  const Tag = (`h${c.level ?? 2}`) as "h2" | "h3" | "h4";
  return (
    <Tag
      id={slugifyHeading(c.text)}
      className={cn(
        "scroll-mt-24 font-display font-semibold text-ink",
        c.level === 2 || !c.level ? "pt-4 text-xl sm:text-2xl" : c.level === 3 ? "pt-2 text-lg" : "text-base"
      )}
    >
      {c.text}
    </Tag>
  );
}

const highlightTone = {
  info: "border-sky/30 bg-sky-soft",
  warning: "border-xp-bright/40 bg-xp-soft",
  success: "border-pass/30 bg-pass-soft",
};

export function TextBlock({ c, title }: { c: TextContent; title?: string | null }) {
  const tone = c.highlight && c.highlight !== "normal" ? highlightTone[c.highlight] : null;
  if (!c.body?.trim() && !title) return null;
  return (
    <div className={cn(tone && "rounded-lg border p-4 sm:p-5", tone)}>
      {title && <h3 className="mb-2 text-lg font-semibold text-ink">{title}</h3>}
      <RichText text={c.body} />
    </div>
  );
}

export function ObjectivesBlock({ c }: { c: ObjectivesContent }) {
  return (
    <section aria-label="Dərsin məqsədləri" className="rounded-xl border border-iris/25 bg-iris-soft/60 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-iris-ink">
        <Target className="h-4 w-4" aria-hidden /> Bu dərsdən sonra
      </h2>
      <ul className="grid gap-2">
        {c.items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[0.98rem] text-ink-2">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-iris" aria-hidden />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KeyTermsBlock({ c }: { c: KeyTermsContent }) {
  return (
    <section aria-label="Əsas terminlər">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
        <BookMarked className="h-4 w-4" aria-hidden /> Əsas terminlər
      </h2>
      <dl className="grid gap-2 sm:grid-cols-2">
        {c.terms.map((t) => (
          <div key={t.term} className="rounded-lg border border-line bg-surface p-3.5">
            <dt className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[0.92rem] font-semibold text-iris-ink">{t.term}</span>
              {t.az && <span className="text-sm text-muted">{t.az}</span>}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink-2">{renderInline(t.definition)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ImageBlock({ c, fallbackUrl }: { c: ImageContent; fallbackUrl?: string | null }) {
  const url = c.url || fallbackUrl;
  if (!url) return null;
  return (
    <figure className={cn("flex flex-col", c.alignment === "left" ? "items-start" : c.alignment === "right" ? "items-end" : "items-center")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={c.alt || c.caption || ""} loading="lazy" className="max-h-[480px] w-auto max-w-full rounded-lg border border-line bg-surface-2 object-contain" />
      {c.caption && <figcaption className="mt-2 text-center text-sm text-muted">{c.caption}</figcaption>}
    </figure>
  );
}

function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

export function VideoBlock({ c, title }: { c: VideoContent; title?: string | null }) {
  if (!c.url) return null;
  const yt = c.source === "external" ? youtubeId(c.url) : null;
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border border-line bg-black">
        {yt ? (
          <iframe
            className="aspect-video w-full"
            src={`https://www.youtube-nocookie.com/embed/${yt}`}
            title={title || c.caption || "Video dərs"}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : c.source === "external" ? (
          <iframe className="aspect-video w-full" src={c.url} title={title || c.caption || "Video dərs"} allowFullScreen loading="lazy" />
        ) : (
          <video className="aspect-video w-full" src={c.url} poster={c.thumbnailUrl ?? undefined} controls preload="metadata" />
        )}
      </div>
      {c.caption && <figcaption className="mt-2 text-sm text-muted">{c.caption}</figcaption>}
    </figure>
  );
}

export function ExampleBlock({ c, title }: { c: ExampleContent; title?: string | null }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-semibold text-sky">
        <Lightbulb className="h-4 w-4" aria-hidden /> {title || "Nümunə"}
      </div>
      <div className="p-4 sm:p-5">
        <RichText text={c.description} />
        {c.relatedImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.relatedImageUrl} alt={title ?? "Nümunə şəkli"} loading="lazy" className="mt-4 max-w-full rounded-lg border border-line" />
        )}
        {c.takeaway && (
          <p className="mt-4 flex gap-2 rounded-lg bg-sky-soft px-3.5 py-2.5 text-sm text-ink-2">
            <Pin className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
            <span><strong className="text-ink">Nəticə:</strong> {renderInline(c.takeaway)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function TableBlock({ c, title }: { c: TableContent; title?: string | null }) {
  if (!c.headers?.length) return null;
  return (
    <figure>
      {title && <figcaption className="mb-2 font-semibold text-ink">{title}</figcaption>}
      <Table>
        <TableHead>
          <TableRow>{c.headers.map((h, i) => <TableTh key={i}>{renderInline(h)}</TableTh>)}</TableRow>
        </TableHead>
        <TableBody>
          {c.rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableTd key={j} className={j === 0 ? "font-medium text-ink" : undefined}>{renderInline(cell)}</TableTd>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </figure>
  );
}

const noteStyle = {
  important: { icon: Flag, label: "Vacib", cls: "border-l-bug bg-bug-soft", ic: "text-bug" },
  warning: { icon: AlertTriangle, label: "Diqqət", cls: "border-l-xp-bright bg-xp-soft", ic: "text-xp" },
  tip: { icon: Lightbulb, label: "İpucu", cls: "border-l-pass bg-pass-soft", ic: "text-pass" },
  remember: { icon: Info, label: "Yadda saxla", cls: "border-l-iris bg-iris-soft", ic: "text-iris" },
};

export function NoteBlock({ c, title }: { c: NoteContent; title?: string | null }) {
  const s = noteStyle[c.variant] ?? noteStyle.remember;
  const Icon = s.icon;
  return (
    <aside className={cn("rounded-r-lg border-l-4 p-4 sm:p-5", s.cls)}>
      <p className={cn("mb-1.5 flex items-center gap-2 text-sm font-semibold", s.ic)}>
        <Icon className="h-4 w-4" aria-hidden /> {title || s.label}
      </p>
      <RichText text={c.body} className="text-[0.98rem]" />
    </aside>
  );
}

const calloutTone = {
  blue: "border-sky/30 bg-sky-soft",
  green: "border-pass/30 bg-pass-soft",
  yellow: "border-xp-bright/40 bg-xp-soft",
  red: "border-bug/30 bg-bug-soft",
  purple: "border-iris/30 bg-iris-soft",
};

export function CalloutBlock({ c }: { c: CalloutContent }) {
  return (
    <aside className={cn("flex gap-3.5 rounded-xl border p-4 sm:p-5", calloutTone[c.color] ?? calloutTone.purple)}>
      {c.emoji && <span className="text-2xl leading-none" aria-hidden>{c.emoji}</span>}
      <div className="min-w-0">
        {c.title && <p className="mb-1 font-semibold text-ink">{c.title}</p>}
        <RichText text={c.body} className="text-[0.98rem]" />
      </div>
    </aside>
  );
}

export function StepperBlock({ c, title }: { c: StepperContent; title?: string | null }) {
  return (
    <div>
      {title && <p className="mb-3 font-semibold text-ink">{title}</p>}
      <ol className="relative grid gap-0">
        {c.steps.map((s, i) => (
          <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
            {i < c.steps.length - 1 && <span aria-hidden className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-line" />}
            <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-iris font-display text-sm font-semibold text-white">{i + 1}</span>
            <div className="min-w-0 pt-1">
              <p className="font-semibold text-ink">{s.title}</p>
              {s.description && <RichText text={s.description} className="mt-1 text-[0.97rem]" />}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SummaryBlock({ c }: { c: SummaryContent }) {
  return (
    <section aria-label="Xülasə" className="rounded-xl border border-pass/30 bg-pass-soft/70 p-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-pass">
        <ListChecks className="h-5 w-5" aria-hidden /> Qısa xülasə
      </h2>
      <ul className="grid gap-2">
        {c.points.map((p, i) => (
          <li key={i} className="flex gap-2.5 text-ink-2">
            <Check className="mt-1 h-4 w-4 shrink-0 text-pass" aria-hidden />
            <span>{renderInline(p)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Code (read-only, highlighted) ─────────────────────────────

const JS_LIKE = new Set(["javascript", "js", "typescript", "ts", "jsx", "tsx", "json"]);

function useHighlighted(code: string, language: string) {
  const [nodes, setNodes] = useState<{ text: string; cls: string }[] | null>(null);
  useEffect(() => {
    if (!JS_LIKE.has(language.toLowerCase())) return;
    let cancelled = false;
    (async () => {
      const [{ javascriptLanguage, typescriptLanguage }, { highlightCode, classHighlighter }] = await Promise.all([
        import("@codemirror/lang-javascript"),
        import("@lezer/highlight"),
      ]);
      const lang = language.startsWith("t") ? typescriptLanguage : javascriptLanguage;
      const out: { text: string; cls: string }[] = [];
      highlightCode(code, lang.parser.parse(code), classHighlighter,
        (text, cls) => out.push({ text, cls }),
        () => out.push({ text: "\n", cls: "" }));
      if (!cancelled) setNodes(out);
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [code, language]);
  return nodes;
}

export function CodeBlock({ c, title }: { c: CodeContent; title?: string | null }) {
  const [copied, setCopied] = useState(false);
  const nodes = useHighlighted(c.code ?? "", c.language ?? "");
  if (!c.code?.trim()) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(c.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-code-bg">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <span className="font-mono text-xs text-code-ink/60">{title || c.language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-code-ink/70 hover:bg-white/10 hover:text-code-ink" aria-label="Kodu kopyala">
          {copied ? <><Check className="h-3.5 w-3.5" /> Kopyalandı</> : <><Copy className="h-3.5 w-3.5" /> Kopyala</>}
        </button>
      </div>
      <pre className="code-hl overflow-x-auto p-4 font-mono text-[0.88rem] leading-relaxed text-code-ink">
        <code>{nodes ? nodes.map((n, i) => (n.cls ? <span key={i} className={n.cls}>{n.text}</span> : n.text)) : c.code}</code>
      </pre>
      {c.caption && <figcaption className="border-t border-white/10 px-4 py-2 text-sm text-code-ink/70">{c.caption}</figcaption>}
    </figure>
  );
}

// ── Mermaid diagram (strict security level, themed) ──────────

export function DiagramBlock({ c }: { c: DiagramContent }) {
  const { resolvedTheme } = useTheme();
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "base",
          fontFamily: "var(--font-bricolage), sans-serif",
          themeVariables: resolvedTheme === "dark" ? {} : {
            primaryColor: "#ecebff", primaryBorderColor: "#5b4bff", primaryTextColor: "#14152b", lineColor: "#6a6e88",
          },
        });
        const { svg } = await mermaid.render(`mmd-${id}-${resolvedTheme}`, c.code);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [c.code, id, resolvedTheme]);

  return (
    <figure className="rounded-xl border border-line bg-surface p-4">
      {failed ? (
        <pre className="overflow-x-auto font-mono text-sm text-muted">{c.code}</pre>
      ) : svg ? (
        // Mermaid output rendered with securityLevel "strict" (sanitised SVG).
        <div className="mermaid-host flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="h-40 animate-pulse rounded-lg bg-surface-2" aria-label="Diaqram yüklənir" />
      )}
      {c.caption && <figcaption className="mt-3 text-center text-sm text-muted">{c.caption}</figcaption>}
    </figure>
  );
}

// ── Checklist (remembered per browser) ───────────────────────

const checklistListeners = new Set<() => void>();
function subscribeChecklist(cb: () => void) {
  checklistListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { checklistListeners.delete(cb); window.removeEventListener("storage", cb); };
}
function readStorage(key: string) {
  try { return localStorage.getItem(key) ?? "[]"; } catch { return "[]"; }
}

export function ChecklistBlock({ c, title, blockId }: { c: ChecklistContent; title?: string | null; blockId: string }) {
  const key = `narix:checklist:${blockId}`;
  // Server snapshot is empty; the browser value is read after hydration.
  const raw = useSyncExternalStore(subscribeChecklist, () => readStorage(key), () => "[]");
  const done = useMemo(() => {
    try { return new Set<string>(JSON.parse(raw)); } catch { return new Set<string>(); }
  }, [raw]);
  const pct = c.items.length ? Math.round((done.size / c.items.length) * 100) : 0;

  function toggle(id: string) {
    const next = new Set(done);
    if (next.has(id)) next.delete(id); else next.add(id);
    try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* storage unavailable */ }
    checklistListeners.forEach((l) => l());
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">{title || "Yoxlama siyahısı"}</p>
        <span className="text-sm text-muted">{done.size}/{c.items.length}</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full bg-pass-bright transition-[width]" style={{ width: `${pct}%` }} /></div>
      <ul className="grid gap-1">
        {c.items.map((item) => {
          const checked = done.has(item.id);
          return (
            <li key={item.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-2">
                <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="h-5 w-5 accent-[var(--c-pass)]" />
                <span className={cn("text-ink-2", checked && "text-muted line-through")}>{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DividerBlock() {
  return <hr className="my-2 border-0 border-t border-dashed border-line-strong" />;
}

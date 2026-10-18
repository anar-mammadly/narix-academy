import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Small, safe markdown subset → React elements (no innerHTML):
// paragraphs, "- " / "• " bullets, "1. " lists, **bold**, *italic*, `code`, [text](https://link).

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\)|\*[^*\s][^*]*\*)/g;

export function renderInline(text: string): ReactNode[] {
  const parts = text.split(INLINE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("[")) {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        const external = m[2].startsWith("http");
        return (
          <a key={i} href={m[2]} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {m[1]}
          </a>
        );
      }
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Chunk = { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

function parse(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const last = chunks[chunks.length - 1];
    if (!line) {
      chunks.push({ kind: "p", lines: [] });
      continue;
    }
    const bullet = line.match(/^(?:[-•*]|👉|✅|❌|✔|🔹)\s+(.*)$/u);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet && !line.startsWith("**")) {
      const item = line.startsWith("-") || line.startsWith("•") || line.startsWith("*") ? bullet[1] : line;
      if (last?.kind === "ul") last.items.push(item);
      else chunks.push({ kind: "ul", items: [item] });
    } else if (numbered) {
      if (last?.kind === "ol") last.items.push(numbered[1]);
      else chunks.push({ kind: "ol", items: [numbered[1]] });
    } else if (last?.kind === "p") {
      last.lines.push(line);
    } else {
      chunks.push({ kind: "p", lines: [line] });
    }
  }
  return chunks.filter((c) => (c.kind === "p" ? c.lines.length > 0 : c.items.length > 0));
}

export function RichText({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={cn("prose-lesson", className)}>
      {parse(text).map((c, i) => {
        if (c.kind === "ul") return <ul key={i}>{c.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ul>;
        if (c.kind === "ol") return <ol key={i}>{c.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}</ol>;
        if (c.kind !== "p") return null;
        return (
          <p key={i}>
            {c.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

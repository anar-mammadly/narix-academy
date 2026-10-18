import type { BlockType } from "@/types/blocks";
import { BUG_HUNT_SCENARIOS } from "@/lib/bug-hunt";

type Loose = Record<string, unknown>;

const strip = (s: string) => s.replace(/[*_`#>\[\]()]/g, "").replace(/\s+/g, " ").trim();
const str = (v: unknown) => (typeof v === "string" ? strip(v) : "");
const count = (v: unknown) => (Array.isArray(v) ? v.length : 0);

/** One-line preview of a block's content for the collapsed card. */
export function blockSummary(type: BlockType, raw: unknown): string {
  const c = (raw && typeof raw === "object" ? raw : {}) as Loose;
  switch (type) {
    case "HEADING": return str(c.text);
    case "TEXT": return str(c.body) || "Boş mətn";
    case "OBJECTIVES": return `${count(c.items)} məqsəd`;
    case "KEY_TERMS": return `${count(c.terms)} termin`;
    case "IMAGE": return str(c.alt) || str(c.caption) || (c.url ? "Şəkil" : "Şəkil seçilməyib");
    case "VIDEO": return str(c.caption) || (c.url ? String(c.url) : "Video seçilməyib");
    case "EXAMPLE": return str(c.description) || "Boş nümunə";
    case "TABLE": return `${count(c.headers)} sütun · ${count(c.rows)} sətir`;
    case "NOTE": return str(c.body) || "Boş qeyd";
    case "CALLOUT": return [str(c.emoji), str(c.title) || str(c.body)].filter(Boolean).join(" ");
    case "STEPPER": return `${count(c.steps)} addım`;
    case "CODE": return `${str(c.language) || "kod"} · ${typeof c.code === "string" ? c.code.split("\n").length : 0} sətir`;
    case "DIAGRAM": return str(c.caption) || "Mermaid diaqramı";
    case "CHECKLIST": return `${count(c.items)} bənd`;
    case "SUMMARY": return `${count(c.points)} əsas fikir`;
    case "DIVIDER": return "";
    case "QUIZ": return `${count(c.questions)} sual`;
    case "ORDERING": return `${count(c.items)} element`;
    case "CATEGORIZE": return `${count(c.categories)} kateqoriya · ${count(c.items)} element`;
    case "CODE_EXERCISE": return `${count(c.tests)} test · ${str(c.instructions)}`;
    case "BUG_HUNT": return BUG_HUNT_SCENARIOS[c.scenario as keyof typeof BUG_HUNT_SCENARIOS]?.title ?? "Ssenari seçilməyib";
    case "TEST_CASE_BUILDER": return str(c.feature);
    case "BUG_REPORT_BUILDER": return str(c.scenario);
    case "API_PLAYGROUND": return `${count(c.endpoints)} endpoint · ${count(c.tasks)} sual`;
    case "TASK": return str(c.instructions);
  }
}

import type { ZodIssue } from "zod";
import { contentSchemas, validateBlock } from "@/lib/block-schema";
import type { BlockType } from "@/types/blocks";

const PATH_LABEL: Record<string, string> = {
  questions: "Sual", options: "Variant", items: "Element", terms: "Termin", steps: "Addım", headers: "Sütun",
  rows: "Sətir", categories: "Kateqoriya", tests: "Test", endpoints: "Endpoint", tasks: "Tapşırıq", points: "Fikir",
  hints: "İpucu", expectedKeywords: "Açar söz", keywords: "Açar söz",
  text: "mətn", term: "termin", definition: "izah", title: "başlıq", body: "mətn", label: "ad", question: "sual",
  instructions: "təlimat", code: "kod", solution: "həll", assert: "yoxlama", name: "ad", feature: "funksiya",
  requirement: "tələb", expected: "gözlənilən nəticə", actual: "faktiki nəticə", scenario: "ssenari", baseUrl: "baza URL",
  path: "yol", status: "status", correctIndex: "düzgün cavab", categoryId: "kateqoriya", sampleSolution: "nümunə həll",
  minSteps: "minimum addım", level: "səviyyə", url: "URL",
};

function humanPath(path: (string | number)[]) {
  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const seg = path[i];
    const next = path[i + 1];
    if (typeof seg === "string" && typeof next === "number") {
      parts.push(`${PATH_LABEL[seg] ?? seg} ${next + 1}`);
      i++;
    } else if (typeof seg === "string") {
      parts.push(PATH_LABEL[seg] ?? seg);
    }
  }
  return parts.join(" › ");
}

function humanIssue(issue: ZodIssue) {
  let msg: string;
  switch (issue.code) {
    case "too_small":
      msg = issue.type === "array" ? `ən az ${issue.minimum} element olmalıdır` : issue.type === "string" ? "boş ola bilməz" : `ən az ${issue.minimum} olmalıdır`;
      break;
    case "too_big":
      msg = issue.type === "array" ? `ən çox ${issue.maximum} element ola bilər` : `ən çox ${issue.maximum} ola bilər`;
      break;
    case "invalid_type":
      msg = issue.received === "undefined" ? "tələb olunur" : "yanlış tipdədir";
      break;
    case "invalid_enum_value":
      msg = `icazə verilən dəyərlər: ${issue.options.join(", ")}`;
      break;
    default:
      msg = issue.message;
  }
  const where = humanPath(issue.path);
  return where ? `${where}: ${msg}` : msg.charAt(0).toUpperCase() + msg.slice(1);
}

export type CheckResult = { ok: true; content: unknown } | { ok: false; issues: string[] };

/** validateBlock, with issues rephrased for teachers. */
export function checkBlock(type: BlockType, title: string | null, content: unknown): CheckResult {
  const result = validateBlock({ type, title, content });
  if (result.ok) return { ok: true, content: result.block.content };
  const parsed = contentSchemas[type].safeParse(content ?? {});
  const issues = parsed.success ? [result.error] : parsed.error.issues.map(humanIssue);
  return { ok: false, issues: Array.from(new Set(issues)) };
}

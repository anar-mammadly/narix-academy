// Pure graders shared by the lesson player (instant feedback) and the
// /api/blocks/attempt route (authoritative score + XP).
import type {
  ApiPlaygroundContent, BlockType, BugHuntContent, BugReportBuilderContent,
  CategorizeContent, OrderingContent, QuizContent, TestCaseBuilderContent,
} from "@/types/blocks";
import { BUG_HUNT_PASS_RATIO, BUG_HUNT_SCENARIOS } from "./bug-hunt";

export type GradeResult = {
  score: number; // 0–100
  passed: boolean;
  wrongIds?: string[]; // quiz/api question ids answered wrongly
  checks?: { label: string; ok: boolean }[]; // builder rubric
};

export const DEFAULT_PASS_MARK = 70;

export function normalize(s: string) {
  return s
    .toLocaleLowerCase("az")
    .replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordRatio(text: string, keywords: string[]) {
  if (!keywords.length) return 1;
  const hay = normalize(text);
  const hits = keywords.filter((k) => hay.includes(normalize(k))).length;
  return hits / keywords.length;
}

function choiceScore(questions: { id: string; correctIndex: number }[], answers: Record<string, number>) {
  const wrongIds = questions.filter((q) => answers[q.id] !== q.correctIndex).map((q) => q.id);
  const score = questions.length ? Math.round(((questions.length - wrongIds.length) / questions.length) * 100) : 0;
  return { score, wrongIds };
}

type Answer = Record<string, unknown>;

export function gradeBlock(type: BlockType, content: unknown, answer: Answer, passMark = DEFAULT_PASS_MARK): GradeResult | null {
  switch (type) {
    case "QUIZ": {
      const c = content as QuizContent;
      const { score, wrongIds } = choiceScore(c.questions ?? [], (answer.answers as Record<string, number>) ?? {});
      return { score, passed: score >= passMark, wrongIds };
    }
    case "API_PLAYGROUND": {
      const c = content as ApiPlaygroundContent;
      const { score, wrongIds } = choiceScore(c.tasks ?? [], (answer.answers as Record<string, number>) ?? {});
      return { score, passed: score >= passMark, wrongIds };
    }
    case "ORDERING": {
      const c = content as OrderingContent;
      const order = (answer.order as string[]) ?? [];
      const right = c.items.filter((item, i) => order[i] === item).length;
      const score = c.items.length ? Math.round((right / c.items.length) * 100) : 0;
      return { score, passed: score === 100 };
    }
    case "CATEGORIZE": {
      const c = content as CategorizeContent;
      const placement = (answer.placement as Record<string, string>) ?? {};
      const right = c.items.filter((i) => placement[i.id] === i.categoryId).length;
      const score = c.items.length ? Math.round((right / c.items.length) * 100) : 0;
      return { score, passed: score === 100, wrongIds: c.items.filter((i) => placement[i.id] !== i.categoryId).map((i) => i.id) };
    }
    case "CODE_EXERCISE": {
      const passedTests = Number(answer.passedTests ?? 0);
      const total = Math.max(1, Number(answer.total ?? 1));
      const score = Math.round((Math.min(passedTests, total) / total) * 100);
      return { score, passed: score === 100 };
    }
    case "BUG_HUNT": {
      const c = content as BugHuntContent;
      const scenario = BUG_HUNT_SCENARIOS[c.scenario];
      if (!scenario) return null;
      const valid = new Set(scenario.bugs.map((b) => b.id));
      const found = new Set(((answer.found as string[]) ?? []).filter((id) => valid.has(id)));
      const ratio = found.size / scenario.bugs.length;
      return { score: Math.round(ratio * 100), passed: ratio >= BUG_HUNT_PASS_RATIO };
    }
    case "TEST_CASE_BUILDER": {
      const c = content as TestCaseBuilderContent;
      const title = String(answer.title ?? "");
      const pre = String(answer.preconditions ?? "");
      const steps = ((answer.steps as string[]) ?? []).map((s) => s.trim()).filter(Boolean);
      const expected = String(answer.expected ?? "");
      const all = [title, pre, ...steps, expected].join(" ");
      const checks = [
        { label: "Başlıq aydındır (ən az 10 simvol)", ok: title.trim().length >= 10 },
        { label: `Ən az ${c.minSteps} addım yazılıb`, ok: steps.length >= c.minSteps },
        { label: "Gözlənilən nəticə yazılıb", ok: expected.trim().length >= 8 },
        { label: "Əsas anlayışlar əhatə olunub", ok: keywordRatio(all, c.expectedKeywords) >= 0.5 },
      ];
      const score = Math.round((checks.filter((x) => x.ok).length / checks.length) * 100);
      return { score, passed: score >= 75, checks };
    }
    case "BUG_REPORT_BUILDER": {
      const c = content as BugReportBuilderContent;
      const title = String(answer.title ?? "");
      const steps = ((answer.steps as string[]) ?? []).map((s) => s.trim()).filter(Boolean);
      const expected = String(answer.expected ?? "");
      const actual = String(answer.actual ?? "");
      const all = [title, ...steps, expected, actual].join(" ");
      const checks = [
        { label: "Başlıq qısa və konkretdir (10–90 simvol)", ok: title.trim().length >= 10 && title.trim().length <= 90 },
        { label: "Təkrarlama addımları (ən az 2)", ok: steps.length >= 2 },
        { label: "Expected və Actual fərqli yazılıb", ok: expected.trim().length >= 5 && actual.trim().length >= 5 && normalize(expected) !== normalize(actual) },
        { label: `Severity düzgündür`, ok: answer.severity === c.expectedSeverity },
        { label: `Priority düzgündür`, ok: answer.priority === c.expectedPriority },
        { label: "Əsas detallar qeyd olunub", ok: keywordRatio(all, c.keywords) >= 0.5 },
      ];
      const score = Math.round((checks.filter((x) => x.ok).length / checks.length) * 100);
      return { score, passed: score >= 70, checks };
    }
    default:
      return null;
  }
}

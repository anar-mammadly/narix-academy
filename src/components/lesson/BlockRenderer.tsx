"use client";

import dynamic from "next/dynamic";
import { parseJson, type BlockType, type LessonBlockData } from "@/types/blocks";
import type { AttemptState } from "./shared";
import * as R from "./blocks/ReadingBlocks";
import Quiz from "./blocks/Quiz";
import Ordering from "./blocks/Ordering";
import Categorize from "./blocks/Categorize";
import Task from "./blocks/Task";

const loading = () => <div className="h-64 animate-pulse rounded-xl border border-line bg-surface-2" aria-label="Yüklənir" />;
const CodeExercise = dynamic(() => import("./blocks/CodeExercise"), { ssr: false, loading });
const BugHunt = dynamic(() => import("./blocks/BugHunt"), { ssr: false, loading });
const TestCaseBuilder = dynamic(() => import("./blocks/TestCaseBuilder"), { ssr: false, loading });
const BugReportBuilder = dynamic(() => import("./blocks/BugReportBuilder"), { ssr: false, loading });
const ApiPlayground = dynamic(() => import("./blocks/ApiPlayground"), { ssr: false, loading });

export function BlockRenderer({
  block, lessonId, attempt, submission,
}: { block: LessonBlockData; lessonId: string; attempt: AttemptState; submission: string | null }) {
  const type = block.type as BlockType;
  const c = parseJson<any>(block.content, {});
  const common = { blockId: block.id, type, title: block.title, content: c, initial: attempt };

  switch (type) {
    case "HEADING": return <R.HeadingBlock c={c} />;
    case "TEXT": return <R.TextBlock c={c} title={block.title} />;
    case "OBJECTIVES": return <R.ObjectivesBlock c={c} />;
    case "KEY_TERMS": return <R.KeyTermsBlock c={c} />;
    case "IMAGE": return <R.ImageBlock c={c} fallbackUrl={block.imageUrl} />;
    case "VIDEO": return <R.VideoBlock c={c} title={block.title} />;
    case "EXAMPLE": return <R.ExampleBlock c={c} title={block.title} />;
    case "TABLE": return <R.TableBlock c={c} title={block.title} />;
    case "NOTE": return <R.NoteBlock c={c} title={block.title} />;
    case "CALLOUT": return <R.CalloutBlock c={c} />;
    case "STEPPER": return <R.StepperBlock c={c} title={block.title} />;
    case "CODE": return <R.CodeBlock c={c} title={block.title} />;
    case "DIAGRAM": return <R.DiagramBlock c={c} />;
    case "CHECKLIST": return <R.ChecklistBlock c={c} title={block.title} blockId={block.id} />;
    case "SUMMARY": return <R.SummaryBlock c={c} />;
    case "DIVIDER": return <R.DividerBlock />;
    case "QUIZ": return <Quiz {...common} />;
    case "ORDERING": return <Ordering {...common} />;
    case "CATEGORIZE": return <Categorize {...common} />;
    case "CODE_EXERCISE": return <CodeExercise {...common} />;
    case "BUG_HUNT": return <BugHunt {...common} />;
    case "TEST_CASE_BUILDER": return <TestCaseBuilder {...common} />;
    case "BUG_REPORT_BUILDER": return <BugReportBuilder {...common} />;
    case "API_PLAYGROUND": return <ApiPlayground {...common} />;
    case "TASK": return <Task blockId={block.id} lessonId={lessonId} title={block.title} content={c} initialAnswer={submission} />;
    default: return null;
  }
}

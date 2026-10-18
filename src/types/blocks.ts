// Lesson block contract shared by the lesson player, the admin editor,
// the JSON importer and the curriculum files in /content.
// Text fields support a small markdown subset: **bold**, *italic*, `code`,
// [link](https://...), "- " bullets and "1. " numbered lists.

export const BLOCK_TYPES = [
  // reading
  "HEADING",
  "TEXT",
  "OBJECTIVES",
  "KEY_TERMS",
  "IMAGE",
  "VIDEO",
  "EXAMPLE",
  "TABLE",
  "NOTE",
  "CALLOUT",
  "STEPPER",
  "CODE",
  "DIAGRAM",
  "CHECKLIST",
  "SUMMARY",
  "DIVIDER",
  // interactive (graded on the client, award XP)
  "QUIZ",
  "ORDERING",
  "CATEGORIZE",
  "CODE_EXERCISE",
  "BUG_HUNT",
  "TEST_CASE_BUILDER",
  "BUG_REPORT_BUILDER",
  "API_PLAYGROUND",
  // open answer reviewed by the teacher
  "TASK",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const INTERACTIVE_BLOCKS: BlockType[] = [
  "QUIZ", "ORDERING", "CATEGORIZE", "CODE_EXERCISE",
  "BUG_HUNT", "TEST_CASE_BUILDER", "BUG_REPORT_BUILDER", "API_PLAYGROUND",
];

export type HeadingContent = { text: string; level: 2 | 3 | 4 };
export type TextContent = { body: string; highlight?: "normal" | "info" | "warning" | "success" };
export type ObjectivesContent = { items: string[] };
export type KeyTermsContent = { terms: { term: string; az?: string; definition: string }[] };
export type ImageContent = { url: string; caption?: string; alt: string; alignment?: "left" | "center" | "right" };
export type VideoContent = {
  url: string;
  source: "upload" | "external";
  caption?: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
};
export type ExampleContent = { description: string; takeaway?: string; relatedImageUrl?: string | null };
export type TableContent = { headers: string[]; rows: string[][] };
export type NoteContent = { variant: "important" | "remember" | "tip" | "warning"; body: string };
export type CalloutContent = { emoji?: string; title: string; body: string; color: "blue" | "green" | "yellow" | "red" | "purple" };
export type StepperContent = { steps: { title: string; description: string; icon?: string }[] };
export type CodeContent = { code: string; language: string; caption?: string };
export type DiagramContent = { code: string; caption?: string };
export type ChecklistContent = { items: { id: string; text: string }[] };
export type SummaryContent = { points: string[] };
export type DividerContent = Record<string, never>;

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[]; // 2–4 options
  correctIndex: number;
  explanation?: string;
  imageUrl?: string | null;
};
export type QuizContent = { questions: QuizQuestion[] };

// Items are stored in the correct order; the player shuffles them.
export type OrderingContent = { instructions: string; items: string[]; explanation?: string };

export type CategorizeContent = {
  instructions: string;
  categories: { id: string; label: string }[];
  items: { id: string; text: string; categoryId: string }[];
  explanation?: string;
};

// Each test is a JS expression evaluated after the student's code, e.g. "sum(2, 3) === 5".
export type CodeExerciseContent = {
  language: "javascript";
  instructions: string;
  starterCode: string;
  solution: string;
  tests: { name: string; assert: string }[];
  hints?: string[];
};

// Scenarios are mini apps with seeded bugs and their own requirement list,
// implemented in src/components/lesson/bug-hunt.
export type BugHuntScenario = "login" | "registration" | "cart";
export type BugHuntContent = { scenario: BugHuntScenario; instructions: string };

export type TestCaseBuilderContent = {
  feature: string;
  requirement: string;
  minSteps: number;
  expectedKeywords: string[]; // at least half must appear somewhere in the answer
  sampleSolution: { title: string; preconditions: string; steps: string[]; expected: string };
};

export type Severity = "Critical" | "Major" | "Minor" | "Trivial";
export type Priority = "High" | "Medium" | "Low";
export type BugReportBuilderContent = {
  scenario: string; // what the tester observed
  expectedSeverity: Severity;
  expectedPriority: Priority;
  keywords: string[];
  sampleSolution: { title: string; steps: string[]; expected: string; actual: string };
};

export type ApiEndpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string; // may contain :id
  status: number;
  body: unknown;
  description?: string;
};
export type ApiPlaygroundContent = {
  instructions: string;
  baseUrl: string;
  endpoints: ApiEndpoint[];
  tasks: { id: string; question: string; options: string[]; correctIndex: number; explanation?: string }[];
};

export type TaskContent = { instructions: string; placeholder?: string; required?: boolean };

export type BlockContentMap = {
  HEADING: HeadingContent;
  TEXT: TextContent;
  OBJECTIVES: ObjectivesContent;
  KEY_TERMS: KeyTermsContent;
  IMAGE: ImageContent;
  VIDEO: VideoContent;
  EXAMPLE: ExampleContent;
  TABLE: TableContent;
  NOTE: NoteContent;
  CALLOUT: CalloutContent;
  STEPPER: StepperContent;
  CODE: CodeContent;
  DIAGRAM: DiagramContent;
  CHECKLIST: ChecklistContent;
  SUMMARY: SummaryContent;
  DIVIDER: DividerContent;
  QUIZ: QuizContent;
  ORDERING: OrderingContent;
  CATEGORIZE: CategorizeContent;
  CODE_EXERCISE: CodeExerciseContent;
  BUG_HUNT: BugHuntContent;
  TEST_CASE_BUILDER: TestCaseBuilderContent;
  BUG_REPORT_BUILDER: BugReportBuilderContent;
  API_PLAYGROUND: ApiPlaygroundContent;
  TASK: TaskContent;
};

export type LessonBlockData = {
  id: string;
  type: BlockType;
  title?: string | null;
  content: string; // JSON of BlockContentMap[type]
  imageUrl?: string | null;
  order: number;
};

export type Role = "TEACHER" | "STUDENT";
export type Lang = "az" | "en";

export function parseJson<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

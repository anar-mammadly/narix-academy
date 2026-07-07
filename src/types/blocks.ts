export const BLOCK_TYPES = [
  "HEADING",
  "TEXT",
  "IMAGE",
  "EXAMPLE",
  "TABLE",
  "QUIZ",
  "TASK",
  "NOTE",
  "DIVIDER",
  "VIDEO",
  "CODE",
  "CHECKLIST",
  "DIAGRAM",
  "CALLOUT",
  "STEPPER",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type HeadingContent = { text: string; level: 2 | 3 | 4 };
export type TextContent = { body: string; highlight: "normal" | "info" | "warning" | "success" };
export type ImageContent = { url: string; caption: string; alt: string; alignment: "left" | "center" | "right" };
export type ExampleContent = { description: string; takeaway: string; relatedImageUrl: string | null };
export type TableContent = { headers: string[]; rows: string[][] };
export type QuizQuestion = {
  id: string; text: string;
  options: [string, string, string, string];
  correctIndex: number; explanation?: string; imageUrl?: string | null;
};
export type QuizContent = { questions: QuizQuestion[] };
export type TaskContent = { instructions: string; placeholder: string; required: boolean };
export type NoteContent = { variant: "important" | "remember" | "tip" | "warning"; body: string };
export type DividerContent = Record<string, never>;
export type VideoContent = {
  url: string;
  source: "upload" | "external";
  caption?: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
};
export type CodeContent = { code: string; language: string; caption?: string };
export type ChecklistContent = { items: { id: string; text: string }[] };
export type DiagramContent = { code: string; caption?: string };
export type CalloutContent = { emoji: string; title: string; body: string; color: "blue" | "green" | "yellow" | "red" | "purple" };
export type StepperContent = { steps: { title: string; description: string; icon?: string }[] };

export type Role = "TEACHER" | "STUDENT";
export type Lang = "az" | "en";

export function parseJson<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

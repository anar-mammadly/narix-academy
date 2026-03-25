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
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type HeadingContent = {
  text: string;
  level: 2 | 3 | 4;
};

export type TextContent = {
  body: string;
  highlight: "normal" | "info" | "warning" | "success";
};

export type ImageContent = {
  url: string;
  caption: string;
  alt: string;
  alignment: "left" | "center" | "right";
};

export type ExampleContent = {
  description: string;
  takeaway: string;
  relatedImageUrl: string | null;
};

export type TableContent = {
  headers: string[];
  rows: string[][];
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation?: string;
  imageUrl?: string | null;
};

export type QuizContent = {
  questions: QuizQuestion[];
};

export type TaskContent = {
  instructions: string;
  placeholder: string;
  required: boolean;
};

export type NoteContent = {
  variant: "important" | "remember" | "tip" | "warning";
  body: string;
};

export type DividerContent = Record<string, never>;

export type Role = "TEACHER" | "STUDENT";

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

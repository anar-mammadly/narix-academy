export type EditorBlock = {
  id: string;
  /** Usually a BlockType; legacy rows may hold an unknown type, shown with a warning. */
  type: string;
  title: string | null;
  content: unknown;
  order: number;
};

export type EditorLesson = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  estimatedMinutes: number;
  minQuizScore: number | null;
  published: boolean;
  moduleId: string;
};

export type ModuleOption = { id: string; title: string };

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/** Card status reported to the editor: save status, or "invalid" while the draft fails validation. */
export type CardStatus = SaveStatus | "invalid";

/** Props every form editor receives. */
export type EditorProps<C> = { value: C; onChange: (next: C) => void; blockId: string };

"use client";

import { Component, type ReactNode } from "react";
import type { BlockContentMap, BlockType } from "@/types/blocks";
import type { EditorProps } from "../types";
import * as R from "./reading";
import { ImageEditor, VideoEditor } from "./media";
import { TableEditor } from "./TableEditor";
import { BugHuntEditor, CategorizeEditor, OrderingEditor, QuizEditor, TaskEditor } from "./interactive";

type FormEditors = { [K in BlockType]?: (props: EditorProps<BlockContentMap[K]>) => ReactNode };

const FORMS: FormEditors = {
  HEADING: R.HeadingEditor,
  TEXT: R.TextEditor,
  OBJECTIVES: R.ObjectivesEditor,
  KEY_TERMS: R.KeyTermsEditor,
  IMAGE: ImageEditor,
  VIDEO: VideoEditor,
  EXAMPLE: R.ExampleEditor,
  TABLE: TableEditor,
  NOTE: R.NoteEditor,
  CALLOUT: R.CalloutEditor,
  STEPPER: R.StepperEditor,
  CODE: R.CodeEditor,
  CHECKLIST: R.ChecklistEditor,
  SUMMARY: R.SummaryEditor,
  QUIZ: QuizEditor,
  ORDERING: OrderingEditor,
  CATEGORIZE: CategorizeEditor,
  BUG_HUNT: BugHuntEditor,
  TASK: TaskEditor,
};

export function hasForm(type: BlockType) {
  return type in FORMS || type === "DIVIDER";
}

/** Renders the form editor for a block type. Content shape is trusted to match the type. */
export function BlockForm({ type, value, onChange, blockId }: { type: BlockType; value: unknown; onChange: (next: unknown) => void; blockId: string }) {
  if (type === "DIVIDER") return <p className="text-sm text-muted">Ayırıcının ayarı yoxdur. Bölmələri vizual ayırmaq üçün istifadə edin.</p>;
  const Editor = FORMS[type] as ((p: EditorProps<unknown>) => ReactNode) | undefined;
  if (!Editor) return null;
  return (
    <FormBoundary>
      <Editor value={(value ?? {}) as never} onChange={onChange} blockId={blockId} />
    </FormBoundary>
  );
}

/** If legacy content has an unexpected shape the form may throw; ask for the JSON editor instead. */
class FormBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <p className="rounded-lg bg-bug-soft p-3 text-sm text-bug">
          Bu blokun məzmunu forma ilə açıla bilmir. Yuxarıdakı “JSON” rejiminə keçib düzəldin.
        </p>
      );
    }
    return this.props.children;
  }
}

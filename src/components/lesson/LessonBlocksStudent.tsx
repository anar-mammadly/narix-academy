"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  parseJson,
  type HeadingContent,
  type TextContent,
  type ImageContent,
  type ExampleContent,
  type TableContent,
  type QuizContent,
  type TaskContent,
  type NoteContent,
} from "@/types/blocks";
import { UniformImage } from "./UniformImage";
import { SectionImage } from "./SectionImage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { CheckCircle2, CircleAlert, Lightbulb, Sparkles } from "lucide-react";

export type BlockRow = {
  id: string;
  type: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
};

type Props = {
  lessonId: string;
  blocks: BlockRow[];
  minQuizScore: number | null;
  initialProgress: {
    quizScore: number | null;
    quizPassed: boolean;
    quizAttempts: number;
    completed: boolean;
  };
  taskAnswers: Record<string, string>;
  /** Müəllim önizləməsi — təqdim və test interaksiyası gizlədilir */
  mode?: "study" | "preview";
};

export function LessonBlocksStudent({
  lessonId,
  blocks,
  minQuizScore,
  initialProgress,
  taskAnswers: initialTaskAnswers,
  mode = "study",
}: Props) {
  const isPreview = mode === "preview";
  const [taskAnswers, setTaskAnswers] = useState(initialTaskAnswers);
  const [savingTask, setSavingTask] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    details: { questionId: string; isCorrect: boolean; explanation?: string }[];
  } | null>(
    initialProgress.quizScore != null
      ? {
          score: initialProgress.quizScore,
          passed: initialProgress.quizPassed,
          details: [],
        }
      : null
  );
  const [completing, setCompleting] = useState(false);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);

  async function saveTask(blockId: string) {
    setSavingTask(blockId);
    setCompleteMsg(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, answer: taskAnswers[blockId] || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xəta");
      setCompleteMsg("Tapşırıq yadda saxlanıldı ✓");
    } catch (e) {
      setCompleteMsg(e instanceof Error ? e.message : "Xəta");
    } finally {
      setSavingTask(null);
    }
  }

  async function submitQuiz(blockId: string, questions: QuizContent["questions"]) {
    setCompleteMsg(null);
    const answers: Record<string, number> = {};
    for (const q of questions) {
      if (quizState[q.id] === undefined) {
        setCompleteMsg("Bütün sualları cavablayın.");
        return;
      }
      answers[q.id] = quizState[q.id]!;
    }
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, blockId, answers }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCompleteMsg(data.error || "Test göndərilmədi");
      return;
    }
    setQuizResult({
      score: data.score,
      passed: data.passed,
      details: data.details,
    });
    setCompleteMsg(`Bal: ${data.score}%${data.passed ? " — keçid ✓" : ""}`);
  }

  async function markComplete() {
    setCompleting(true);
    setCompleteMsg(null);
    const res = await fetch("/api/progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCompleteMsg((data.reasons && data.reasons.join(" ")) || data.error || "Xəta");
      setCompleting(false);
      return;
    }
    setCompleteMsg("Dərs tamamlandı kimi qeyd edildi 🎉");
    setCompleting(false);
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      {completeMsg ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 animate-fade-in">
          {completeMsg}
        </div>
      ) : null}

      {blocks.map((block, idx) => (
        <article
          key={block.id}
          className="animate-slide-up rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-soft"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          {block.type === "HEADING" ? (
            <HeadingView content={block.content} />
          ) : null}
          {block.type === "TEXT" ? <TextView title={block.title} content={block.content} /> : null}
          {block.type === "NOTE" ? <NoteView title={block.title} content={block.content} /> : null}
          {block.type === "DIVIDER" ? <hr className="border-t border-slate-200" /> : null}
          {block.type === "EXAMPLE" ? (
            <ExampleView title={block.title} content={block.content} />
          ) : null}
          {block.type === "TABLE" ? <TableView title={block.title} content={block.content} /> : null}
          {block.type === "IMAGE" ? <ImageView content={block.content} /> : null}
          {block.type === "TASK" ? (
            <TaskView
              title={block.title}
              content={block.content}
              value={taskAnswers[block.id] ?? ""}
              onChange={(v) => setTaskAnswers((s) => ({ ...s, [block.id]: v }))}
              onSave={() => saveTask(block.id)}
              saving={savingTask === block.id}
              readOnly={isPreview}
            />
          ) : null}
          {block.type === "QUIZ" ? (
            <QuizView
              blockId={block.id}
              title={block.title}
              content={block.content}
              quizState={quizState}
              setQuizState={setQuizState}
              onSubmit={() => {
                const q = parseJson<QuizContent>(block.content, { questions: [] });
                submitQuiz(block.id, q.questions || []);
              }}
              result={quizResult}
              minQuizScore={minQuizScore}
              readOnly={isPreview}
            />
          ) : null}
          <SectionImage url={block.imageUrl} />
        </article>
      ))}

      {!isPreview ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
          <div className="flex-1 text-sm text-emerald-900">
            <p className="font-medium">Dərsi tamamlamaq</p>
            <p className="text-emerald-800/90">
              Məcburi tapşırıqlar və minimum test balı (əgər təyin olunubsa) yerinə yetirildikdən sonra tamamlaya
              bilərsiniz.
            </p>
          </div>
          <Button onClick={markComplete} disabled={completing || initialProgress.completed}>
            {initialProgress.completed ? "Tamamlanıb ✓" : completing ? "Gözləyin…" : "Dərsi tamamla"}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-5 text-sm text-violet-950">
          👁 Önizləmə rejimi — tələbə təcrübəsi kimi görünür; təqdim və tamamlama deaktivdir.
        </div>
      )}
    </div>
  );
}

function HeadingView({ content }: { content: string }) {
  const c = parseJson<HeadingContent>(content, { text: "", level: 2 });
  const Tag = c.level === 3 ? "h3" : c.level === 4 ? "h4" : "h2";
  return (
    <Tag className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
      {c.text || "Başlıq"}
    </Tag>
  );
}

function TextView({ title, content }: { title: string | null; content: string }) {
  const c = parseJson<TextContent>(content, { body: "", highlight: "normal" });
  const styles = {
    normal: "border-slate-200 bg-white",
    info: "border-blue-200 bg-blue-50/80",
    warning: "border-amber-200 bg-amber-50/80",
    success: "border-emerald-200 bg-emerald-50/80",
  }[c.highlight];
  return (
    <div className={cn("rounded-xl border p-4", styles)}>
      {title ? <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3> : null}
      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">{c.body}</div>
    </div>
  );
}

const noteIcons = {
  important: CircleAlert,
  remember: Sparkles,
  tip: Lightbulb,
  warning: CircleAlert,
} as const;

function NoteView({ title, content }: { title: string | null; content: string }) {
  const c = parseJson<NoteContent>(content, { variant: "tip", body: "" });
  const Icon = noteIcons[c.variant] || Lightbulb;
  const palette = {
    important: "border-red-200 bg-red-50 text-red-950",
    remember: "border-violet-200 bg-violet-50 text-violet-950",
    tip: "border-sky-200 bg-sky-50 text-sky-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
  }[c.variant];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4", palette)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
      <div>
        {title ? <p className="mb-1 font-semibold">{title}</p> : null}
        <p className="whitespace-pre-wrap text-sm leading-relaxed opacity-95">{c.body}</p>
      </div>
    </div>
  );
}

function ExampleView({ title, content }: { title: string | null; content: string }) {
  const c = parseJson<ExampleContent>(content, {
    description: "",
    takeaway: "",
    relatedImageUrl: null,
  });
  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-5">
      {title ? <h3 className="mb-2 text-lg font-semibold text-indigo-950">{title}</h3> : null}
      <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{c.description}</p>
      {c.takeaway ? (
        <div className="mt-4 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2 text-sm text-indigo-900">
          <span className="font-medium">Nəticə: </span>
          {c.takeaway}
        </div>
      ) : null}
      {c.relatedImageUrl ? (
        <div className="mt-4">
          <UniformImage src={c.relatedImageUrl} alt="" caption={null} />
        </div>
      ) : null}
    </div>
  );
}

function TableView({ title, content }: { title: string | null; content: string }) {
  const c = parseJson<TableContent>(content, { headers: [], rows: [] });
  const headers = c.headers || [];
  const rows = c.rows || [];
  return (
    <div>
      {title ? <h3 className="mb-3 text-lg font-semibold text-slate-900">{title}</h3> : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-800">
              {headers.map((h, i) => (
                <th key={i} className="border-b border-slate-200 px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="odd:bg-white even:bg-slate-50/80">
                {row.map((cell, ci) => (
                  <td key={ci} className="border-b border-slate-100 px-4 py-2.5 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ImageView({ content }: { content: string }) {
  const c = parseJson<ImageContent>(content, {
    url: "",
    caption: "",
    alt: "",
    alignment: "center",
  });
  return <UniformImage src={c.url} alt={c.alt} caption={c.caption || null} alignment={c.alignment} />;
}

function TaskView({
  title,
  content,
  value,
  onChange,
  onSave,
  saving,
  readOnly,
}: {
  title: string | null;
  content: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  readOnly?: boolean;
}) {
  const c = parseJson<TaskContent>(content, {
    instructions: "",
    placeholder: "",
    required: false,
  });
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{title || "Tapşırıq"}</h3>
        {c.required ? <Badge variant="warning">Məcburi</Badge> : <Badge variant="muted">İstəyə bağlı</Badge>}
      </div>
      <p className="mb-3 whitespace-pre-wrap text-sm text-slate-600">{c.instructions}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={c.placeholder || "Cavabınızı yazın…"}
        className="min-h-[140px] bg-white"
        readOnly={readOnly}
        disabled={readOnly}
      />
      {!readOnly ? (
        <div className="mt-3">
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? "Göndərilir…" : "Tapşırığı təqdim et"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function QuizView({
  blockId,
  title,
  content,
  quizState,
  setQuizState,
  onSubmit,
  result,
  minQuizScore,
  readOnly,
}: {
  blockId: string;
  title: string | null;
  content: string;
  quizState: Record<string, number>;
  setQuizState: Dispatch<SetStateAction<Record<string, number>>>;
  onSubmit: () => void;
  result: {
    score: number;
    passed: boolean;
    details: { questionId: string; isCorrect: boolean; explanation?: string }[];
  } | null;
  minQuizScore: number | null;
  readOnly?: boolean;
}) {
  const q = parseJson<QuizContent>(content, { questions: [] });
  const questions = q.questions || [];
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{title || "Test"}</h3>
        {minQuizScore != null ? (
          <Badge variant="default">Minimum {minQuizScore}%</Badge>
        ) : null}
      </div>
      <div className="space-y-6">
        {questions.map((qu, qi) => {
          const detail = result?.details.find((d) => d.questionId === qu.id);
          return (
            <div key={qu.id} className="rounded-lg border border-white/80 bg-white p-4 shadow-sm">
              <p className="mb-3 font-medium text-slate-900">
                {qi + 1}. {qu.text}
              </p>
              {qu.imageUrl ? (
                <div className="mb-3">
                  <UniformImage src={qu.imageUrl} alt="" caption={null} />
                </div>
              ) : null}
              <div className="space-y-2">
                {qu.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                      readOnly ? "cursor-default opacity-90" : "cursor-pointer",
                      quizState[qu.id] === oi
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="radio"
                      className="h-4 w-4"
                      name={`q-${blockId}-${qu.id}`}
                      checked={quizState[qu.id] === oi}
                      onChange={() => setQuizState((s) => ({ ...s, [qu.id]: oi }))}
                      disabled={readOnly}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {detail ? (
                <div
                  className={cn(
                    "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                    detail.isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"
                  )}
                >
                  {detail.isCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <CircleAlert className="h-4 w-4 shrink-0" />}
                  <span>{detail.explanation || (detail.isCorrect ? "Düzgün" : "Səhv")}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {!readOnly ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={onSubmit}>
            Testi yoxla
          </Button>
          {result ? (
            <span className="text-sm font-medium text-slate-800">
              Nəticə: {result.score}% {result.passed ? "(keçid)" : ""}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Önizləmədə test göndərilmir.</p>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle2, BookOpen, MessageCircle,
  FileText, ChevronDown, ChevronUp, Send, Save, Trophy, Check
} from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
import { parseJson } from "@/types/blocks";
import type {
  HeadingContent, TextContent, NoteContent, ExampleContent,
  TableContent, QuizContent, TaskContent, ImageContent,
  VideoContent, CodeContent, ChecklistContent, DiagramContent,
  CalloutContent, StepperContent
} from "@/types/blocks";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from "@/components/ui/Table";

type Tab = "content" | "quiz" | "notes" | "qa";

export default function LessonView({ lesson, progress, submissions, note, questions, session }: any) {
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [noteText, setNoteText] = useState(note?.content ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(!!progress?.quizPassed);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(
    progress?.quizScore != null ? { score: progress.quizScore, passed: progress.quizPassed } : null
  );
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(progress?.completed ?? false);
  const [questionText, setQuestionText] = useState({ title: "", body: "" });
  const [questionsList, setQuestionsList] = useState(questions);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [checklistState, setChecklistState] = useState<Record<string, Set<string>>>({});

  const quizBlock = lesson.blocks.find((b: any) => b.type === "QUIZ");
  const quizContent: QuizContent | null = quizBlock ? parseJson(quizBlock.content, { questions: [] }) : null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "content", label: "Dərs", icon: BookOpen },
    ...(lesson.quizEnabled && quizContent?.questions?.length ? [{ key: "quiz" as Tab, label: "Quiz", icon: Trophy }] : []),
    { key: "notes", label: "Qeydlər", icon: FileText },
    { key: "qa", label: `Suallar (${questionsList.length})`, icon: MessageCircle },
  ];

  async function saveNote() {
    await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, content: noteText }) });
    setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000);
  }

  async function submitQuiz() {
    if (!quizContent) return;
    const res = await fetch("/api/quiz/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, answers: quizAnswers }) });
    const data = await res.json();
    setQuizResult(data); setQuizSubmitted(true);
  }

  async function completeLesson() {
    setCompleting(true);
    await fetch("/api/progress/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id }) });
    setCompleted(true); setCompleting(false);
  }

  async function submitQuestion() {
    if (!questionText.title.trim()) return;
    const res = await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, ...questionText }) });
    const q = await res.json();
    setQuestionsList([{ ...q, user: { name: session.name }, replies: [] }, ...questionsList]);
    setQuestionText({ title: "", body: "" });
  }

  async function submitReply(questionId: string) {
    const body = replyText[questionId];
    if (!body?.trim()) return;
    const res = await fetch(`/api/questions/${questionId}/replies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const reply = await res.json();
    setQuestionsList(questionsList.map((q: any) => q.id === questionId ? { ...q, replies: [...q.replies, { ...reply, user: { name: session.name } }] } : q));
    setReplyText({ ...replyText, [questionId]: "" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div>
        <Link href="/dashboard/lessons" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={15} /> Dərslərə qayıt
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-primary font-semibold mb-1">{lesson.module.title}</div>
            <h1 className="text-2xl font-semibold text-gray-900">{lesson.title}</h1>
            {lesson.shortDescription && <p className="text-muted mt-1">{lesson.shortDescription}</p>}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted"><Clock size={13} /> {formatTime(lesson.estimatedMinutes)}</div>
              {completed && <Badge color="green"><CheckCircle2 size={12} /> Tamamlandı</Badge>}
            </div>
          </div>
          {!completed && (
            <Button onClick={completeLesson} loading={completing} className="shrink-0">
              ✓ Tamamla
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Tab)}
        className="w-fit"
        items={tabs.map(({ key, label, icon: Icon }) => ({ value: key, label, icon: <Icon size={15} /> }))}
      />

      {/* Content */}
      {activeTab === "content" && (
        <Card className="p-6 sm:p-8">
          <div className="space-y-7">
            {lesson.blocks.filter((b: any) => b.type !== "QUIZ").map((block: any) => (
              <BlockRenderer key={block.id} block={block} taskAnswers={taskAnswers}
                setTaskAnswers={setTaskAnswers} submissions={submissions} lessonId={lesson.id}
                checklistState={checklistState} setChecklistState={setChecklistState} />
            ))}
          </div>
        </Card>
      )}

      {/* Quiz */}
      {activeTab === "quiz" && quizContent && (
        <div className="space-y-6">
          {quizSubmitted && quizResult ? (
            <Card className={cn("text-center py-10", quizResult.passed ? "border-success/30 bg-success-light" : "border-danger/30 bg-danger-light")}>
              <div className={cn("text-6xl font-bold mb-3", quizResult.passed ? "text-success" : "text-danger")}>{quizResult.score}%</div>
              <div className={cn("text-xl font-semibold mb-1", quizResult.passed ? "text-success" : "text-danger")}>
                {quizResult.passed ? "Keçdiniz! 🎉" : "Yenidən cəhd edin"}
              </div>
              {lesson.minQuizScore && <div className="text-sm text-muted">Keçid balı: {lesson.minQuizScore}%</div>}
              {!quizResult.passed && (
                <Button variant="secondary" className="mt-4" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizResult(null); }}>
                  Yenidən cəhd et
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Quiz — {quizContent.questions.length} sual</h2>
                <div className="text-sm text-muted">{Object.keys(quizAnswers).length}/{quizContent.questions.length} cavablandı</div>
              </div>
              {quizContent.questions.map((q, i) => (
                <Card key={q.id} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold shrink-0">{i + 1}</div>
                    <div className="font-semibold text-gray-900 flex-1">{q.text}</div>
                  </div>
                  {q.imageUrl && <img src={q.imageUrl} className="rounded-xl max-h-48 object-cover" alt="" />}
                  <div className="space-y-2 pl-10">
                    {q.options.map((opt, idx) => (
                      <button key={idx} onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: idx })}
                        className={cn("w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                          quizAnswers[q.id] === idx
                            ? "border-primary bg-primary-light text-primary font-semibold"
                            : "border-gray-200 hover:border-primary/40 hover:bg-gray-50")}>
                        <span className="font-semibold mr-2 text-muted">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              <Button size="lg" className="w-full" disabled={Object.keys(quizAnswers).length < quizContent.questions.length} onClick={submitQuiz}>
                Testi göndər
              </Button>
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Qeydlər</h2>
          <Textarea className="h-48" placeholder="Bu dərs haqqında qeydlərini yaz..." value={noteText} onChange={e => setNoteText(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button onClick={saveNote}><Save size={15} /> Saxla</Button>
            {noteSaved && <span className="text-sm text-success font-medium fade-in">✓ Saxlanıldı</span>}
          </div>
        </Card>
      )}

      {/* Q&A */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="font-semibold text-gray-900">Yeni sual</h2>
            <div>
              <label className="label">Mövzu</label>
              <Input placeholder="Sualın başlığı..." value={questionText.title} onChange={e => setQuestionText({ ...questionText, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Sual</label>
              <Textarea className="h-24" placeholder="Sualını ətraflı yaz..." value={questionText.body} onChange={e => setQuestionText({ ...questionText, body: e.target.value })} />
            </div>
            <Button disabled={!questionText.title.trim()} onClick={submitQuestion}><Send size={15} /> Göndər</Button>
          </Card>
          {questionsList.length === 0 ? (
            <EmptyState icon={<MessageCircle size={28} />} title="Hələ sual yoxdur" description="Bu dərs haqqında ilk sualı sən ver." />
          ) : (
            <div className="space-y-3">
              {questionsList.map((q: any) => (
                <Card key={q.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{q.title}</div>
                      <div className="text-sm text-muted mt-0.5">{q.user.name}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color={q.status === "ANSWERED" ? "green" : "gray"}>{q.status === "ANSWERED" ? "Cavablandı" : "Açıq"}</Badge>
                      <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className="btn-ghost btn-sm">
                        {expandedQ === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                  {q.body && <p className="text-sm text-gray-700">{q.body}</p>}
                  {expandedQ === q.id && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      {q.replies.map((r: any) => (
                        <div key={r.id} className={cn("rounded-xl p-3 text-sm", r.isTeacher ? "bg-primary-light border border-primary/20" : "bg-surface-2")}>
                          <div className="font-semibold text-xs mb-1 text-muted">{r.isTeacher ? "👨‍🏫 " : ""}{r.user.name}</div>
                          <div>{r.body}</div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input className="flex-1" placeholder="Cavab yaz..." value={replyText[q.id] ?? ""} onChange={e => setReplyText({ ...replyText, [q.id]: e.target.value })} />
                        <Button size="sm" onClick={() => submitReply(q.id)}><Send size={13} /></Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formatted text (turns "- " lines into real bullet lists, blank lines into paragraph breaks) ───
function FormattedText({ text, className }: { text: string; className?: string }) {
  const lines = (text ?? "").split("\n");
  const groups: { type: "list" | "p"; lines: string[] }[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    const isBullet = /^[-*•]\s+/.test(line);
    if (line === "") {
      groups.push({ type: "p", lines: [] });
      continue;
    }
    const last = groups[groups.length - 1];
    if (isBullet) {
      const item = line.replace(/^[-*•]\s+/, "");
      if (last?.type === "list") last.lines.push(item);
      else groups.push({ type: "list", lines: [item] });
    } else {
      if (last?.type === "p" && last.lines.length) last.lines.push(line);
      else groups.push({ type: "p", lines: [line] });
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {groups.map((g, i) => {
        if (g.lines.length === 0) return null;
        if (g.type === "list") {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 marker:text-gray-400">
              {g.lines.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
        }
        return (
          <p key={i}>
            {g.lines.map((l, j) => (
              <span key={j}>
                {l}
                {j < g.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// ─── Block Renderer ───────────────────────────────────────────────
function BlockRenderer({ block, taskAnswers, setTaskAnswers, submissions, lessonId, checklistState, setChecklistState }: any) {
  const [taskSaved, setTaskSaved] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState<string>("");
  const [diagramError, setDiagramError] = useState(false);

  async function saveTask() {
    setTaskSaving(true);
    await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, blockId: block.id, answer: taskAnswers[block.id] }) });
    setTaskSaving(false); setTaskSaved(true); setTimeout(() => setTaskSaved(false), 2000);
  }

  // Mermaid diagram rendering
  useEffect(() => {
    if (block.type !== "DIAGRAM") return;
    const c = parseJson<DiagramContent>(block.content, { code: "" });
    if (!c.code) return;
    let cancelled = false;
    import("mermaid").then(mod => {
      const mermaid = mod.default;
      mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
      mermaid.render(`diagram-${block.id}`, c.code).then(({ svg }) => {
        if (!cancelled) setDiagramSvg(svg);
      }).catch(() => { if (!cancelled) setDiagramError(true); });
    }).catch(() => { if (!cancelled) setDiagramError(true); });
    return () => { cancelled = true; };
  }, [block.id, block.type, block.content]);

  switch (block.type) {
    case "HEADING": {
      const c = parseJson<HeadingContent>(block.content, { text: "", level: 2 });
      const sizes: Record<number, string> = { 2: "text-xl", 3: "text-lg", 4: "text-base" };
      const Tag = `h${c.level}` as "h2" | "h3" | "h4";
      return <Tag className={`${sizes[c.level]} font-semibold text-gray-900`}>{c.text}</Tag>;
    }

    case "TEXT": {
      const c = parseJson<TextContent>(block.content, { body: "", highlight: "normal" });
      const cls = c.highlight !== "normal" ? `block-text-${c.highlight}` : "";
      return (
        <div className={cls || ""}>
          {block.title && <div className="font-semibold text-gray-800 mb-1.5 text-sm">{block.title}</div>}
          <FormattedText text={c.body} className="text-gray-700 leading-relaxed" />
        </div>
      );
    }

    case "NOTE": {
      const c = parseJson<NoteContent>(block.content, { variant: "tip", body: "" });
      const cfg: Record<string, { icon: string; label: string; cls: string }> = {
        important: { icon: "⚠️", label: "Vacib",        cls: "block-note-important" },
        tip:       { icon: "💡", label: "Məsləhət",     cls: "block-note-tip" },
        warning:   { icon: "🔶", label: "Diqqət",       cls: "block-note-warning" },
        remember:  { icon: "📌", label: "Yadda saxla",  cls: "block-note-remember" },
      };
      const { icon, label, cls } = cfg[c.variant] ?? cfg.tip;
      return (
        <div className={cls}>
          <div className="font-semibold text-sm mb-1">{icon} {block.title ?? label}</div>
          <FormattedText text={c.body} className="text-sm leading-relaxed" />
        </div>
      );
    }

    case "CALLOUT": {
      const c = parseJson<CalloutContent>(block.content, { emoji: "💡", title: "", body: "", color: "blue" });
      const colors: Record<string, string> = {
        blue:   "bg-primary-light border-primary/20 text-primary",
        green:  "bg-success-light border-success/20 text-success",
        yellow: "bg-warning-light border-warning/20 text-warning",
        red:    "bg-danger-light border-danger/20 text-danger",
        purple: "bg-purple-50 border-purple-200 text-purple-900",
      };
      return (
        <div className={`rounded-2xl border p-5 ${colors[c.color] ?? colors.blue}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">{c.emoji}</span>
            <div>
              {c.title && <div className="font-bold mb-1">{c.title}</div>}
              <FormattedText text={c.body} className="text-sm leading-relaxed" />
            </div>
          </div>
        </div>
      );
    }

    case "STEPPER": {
      const c = parseJson<StepperContent>(block.content, { steps: [] });
      return (
        <div className="space-y-0">
          {block.title && <div className="font-bold text-gray-900 mb-4">{block.title}</div>}
          {c.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shrink-0 z-10">
                  {i + 1}
                </div>
                {i < c.steps.length - 1 && <div className="w-0.5 flex-1 bg-primary-light my-1" />}
              </div>
              <div className={cn("pb-6 flex-1", i === c.steps.length - 1 && "pb-0")}>
                <div className="font-semibold text-gray-900 mt-1.5">{step.title}</div>
                {step.description && <div className="text-sm text-gray-600 mt-1 leading-relaxed">{step.description}</div>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "EXAMPLE": {
      const c = parseJson<ExampleContent>(block.content, { description: "", takeaway: "", relatedImageUrl: null });
      return (
        <div className="card border-l-4 border-primary bg-primary-light/40">
          <div className="font-semibold text-primary mb-2 flex items-center gap-2">📋 {block.title ?? "Nümunə"}</div>
          <FormattedText text={c.description} className="text-sm text-gray-700 mb-3" />
          {c.relatedImageUrl && <img src={c.relatedImageUrl} className="rounded-xl mb-3 max-h-48 object-cover w-full" alt="" />}
          {c.takeaway && (
            <div className="bg-white rounded-xl px-4 py-3 text-sm text-gray-800 font-medium flex items-start gap-2 border border-primary/15">
              <span className="text-success shrink-0 mt-0.5">✅</span> {c.takeaway}
            </div>
          )}
        </div>
      );
    }

    case "TABLE": {
      const c = parseJson<TableContent>(block.content, { headers: [], rows: [] });
      return (
        <div className="space-y-2">
          {block.title && <div className="font-semibold text-gray-900 text-sm">{block.title}</div>}
          <Table>
            <TableHead>
              <TableRow>
                {c.headers.map((h, i) => <TableTh key={i}>{h}</TableTh>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {c.rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => <TableTd key={j}>{cell}</TableTd>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    case "IMAGE": {
      const c = parseJson<ImageContent>(block.content, { url: "", caption: "", alt: "", alignment: "center" });
      if (!c.url) return null;
      const alignClass = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[c.alignment];
      return (
        <figure className={`max-w-2xl ${alignClass}`}>
          <img src={c.url} alt={c.alt} className="rounded-2xl w-full object-cover shadow-md" />
          {c.caption && <figcaption className="text-xs text-muted text-center mt-2 italic">{c.caption}</figcaption>}
        </figure>
      );
    }

    case "VIDEO": {
      const c = parseJson<VideoContent>(block.content, { url: "", source: "external", caption: "" });
      if (!c.url) return null;

      if (c.source === "upload") {
        return (
          <figure className="space-y-2">
            {block.title && <div className="font-semibold text-gray-900">{block.title}</div>}
            <video
              controls
              preload="metadata"
              poster={c.thumbnailUrl ?? undefined}
              className="w-full rounded-2xl bg-black shadow-md"
            >
              <source src={c.url} />
            </video>
            {c.caption && <div className="text-xs text-muted text-center italic">{c.caption}</div>}
          </figure>
        );
      }

      // Legacy / external: YouTube (or other) URL embedded via iframe
      const ytMatch = c.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
      const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : c.url;
      return (
        <figure className="space-y-2">
          {block.title && <div className="font-semibold text-gray-900">{block.title}</div>}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-black" style={{ paddingTop: "56.25%" }}>
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
          {c.caption && <div className="text-xs text-muted text-center italic">{c.caption}</div>}
        </figure>
      );
    }

    case "CODE": {
      const c = parseJson<CodeContent>(block.content, { code: "", language: "bash" });
      const [copied, setCopied] = useState(false);
      function copy() {
        navigator.clipboard.writeText(c.code);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      }
      return (
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900">
            <span className="text-xs font-mono text-gray-400 font-semibold uppercase tracking-wider">{c.language}</span>
            <button onClick={copy} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
              {copied ? <><Check size={12} /> Kopyalandı</> : "Kopyala"}
            </button>
          </div>
          <pre className="bg-gray-950 text-green-400 px-5 py-4 overflow-x-auto text-sm font-mono leading-relaxed">
            <code>{c.code}</code>
          </pre>
          {c.caption && <div className="bg-gray-900 px-4 py-2 text-xs text-gray-500 italic">{c.caption}</div>}
        </div>
      );
    }

    case "CHECKLIST": {
      const c = parseJson<ChecklistContent>(block.content, { items: [] });
      const checked = checklistState[block.id] ?? new Set<string>();
      function toggle(id: string) {
        const next = new Set(checked);
        next.has(id) ? next.delete(id) : next.add(id);
        setChecklistState({ ...checklistState, [block.id]: next });
      }
      const doneCount = checked.size;
      return (
        <div className="card space-y-3">
          {block.title && (
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{block.title}</div>
              <div className="text-xs text-muted">{doneCount}/{c.items.length}</div>
            </div>
          )}
          {block.title && <div className="progress-bar"><div className="progress-fill" style={{ width: `${c.items.length ? (doneCount / c.items.length) * 100 : 0}%` }} /></div>}
          <div className="space-y-2">
            {c.items.map(item => (
              <button key={item.id} onClick={() => toggle(item.id)}
                className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  checked.has(item.id) ? "bg-success-light border-success/30" : "bg-white border-gray-200 hover:border-gray-300")}>
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  checked.has(item.id) ? "bg-success border-success" : "border-gray-300")}>
                  {checked.has(item.id) && <Check size={11} className="text-white" />}
                </div>
                <span className={cn("text-sm", checked.has(item.id) && "line-through text-muted")}>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    case "DIAGRAM": {
      const c = parseJson<DiagramContent>(block.content, { code: "" });
      return (
        <div className="card space-y-2">
          {block.title && <div className="font-semibold text-gray-900">{block.title}</div>}
          {diagramError ? (
            <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600">Diaqram render edilə bilmədi</div>
          ) : diagramSvg ? (
            <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-muted text-sm pulse-soft">Diaqram yüklənir...</div>
          )}
          {c.caption && <div className="text-xs text-muted text-center italic">{c.caption}</div>}
        </div>
      );
    }

    case "TASK": {
      const c = parseJson<TaskContent>(block.content, { instructions: "", placeholder: "", required: false });
      const existing = submissions.find((s: any) => s.blockId === block.id);
      return (
        <div className="card border-warning/30 bg-warning-light/40">
          <div className="font-semibold text-warning mb-2 flex items-center gap-2">📝 {block.title ?? "Tapşırıq"}</div>
          <FormattedText text={c.instructions} className="text-sm text-gray-700 mb-3" />
          <textarea className="textarea h-28 bg-white" placeholder={c.placeholder}
            defaultValue={existing?.answer ?? ""}
            onChange={e => setTaskAnswers({ ...taskAnswers, [block.id]: e.target.value })} />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={saveTask} disabled={taskSaving} className="btn-primary btn-sm">
              <Send size={13} /> {taskSaving ? "Göndərilir..." : "Göndər"}
            </button>
            {(taskSaved || existing) && <span className="text-xs text-success font-medium">✓ Göndərildi</span>}
          </div>
        </div>
      );
    }

    case "DIVIDER":
      return (
        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      );

    default:
      return null;
  }
}

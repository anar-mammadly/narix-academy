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
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <Link href="/dashboard/lessons" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={15} /> Dərslərə qayıt
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-blue-600 font-semibold mb-1">{lesson.module.title}</div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
            {lesson.shortDescription && <p className="text-muted mt-1">{lesson.shortDescription}</p>}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted"><Clock size={13} /> {formatTime(lesson.estimatedMinutes)}</div>
              {completed && <div className="badge badge-green"><CheckCircle2 size={12} /> Tamamlandı</div>}
            </div>
          </div>
          {!completed && (
            <button onClick={completeLesson} disabled={completing} className="btn-primary shrink-0">
              {completing ? "..." : "✓ Tamamla"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "content" && (
        <div className="space-y-5">
          {lesson.blocks.filter((b: any) => b.type !== "QUIZ").map((block: any) => (
            <BlockRenderer key={block.id} block={block} taskAnswers={taskAnswers}
              setTaskAnswers={setTaskAnswers} submissions={submissions} lessonId={lesson.id}
              checklistState={checklistState} setChecklistState={setChecklistState} />
          ))}
        </div>
      )}

      {/* Quiz */}
      {activeTab === "quiz" && quizContent && (
        <div className="space-y-6">
          {quizSubmitted && quizResult ? (
            <div className={cn("card text-center py-10", quizResult.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
              <div className="text-6xl font-black mb-3" style={{ color: quizResult.passed ? "#16a34a" : "#dc2626" }}>{quizResult.score}%</div>
              <div className={cn("text-xl font-bold mb-1", quizResult.passed ? "text-green-700" : "text-red-700")}>
                {quizResult.passed ? "Keçdiniz! 🎉" : "Yenidən cəhd edin"}
              </div>
              {lesson.minQuizScore && <div className="text-sm text-muted">Keçid balı: {lesson.minQuizScore}%</div>}
              {!quizResult.passed && (
                <button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizResult(null); }} className="btn-secondary mt-4">
                  Yenidən cəhd et
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Quiz — {quizContent.questions.length} sual</h2>
                <div className="text-sm text-muted">{Object.keys(quizAnswers).length}/{quizContent.questions.length} cavablandı</div>
              </div>
              {quizContent.questions.map((q, i) => (
                <div key={q.id} className="card space-y-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                    <div className="font-semibold text-gray-900 flex-1">{q.text}</div>
                  </div>
                  {q.imageUrl && <img src={q.imageUrl} className="rounded-xl max-h-48 object-cover" alt="" />}
                  <div className="space-y-2 pl-10">
                    {q.options.map((opt, idx) => (
                      <button key={idx} onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: idx })}
                        className={cn("w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                          quizAnswers[q.id] === idx
                            ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50")}>
                        <span className="font-semibold mr-2 text-muted">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < quizContent.questions.length} className="btn-primary btn-lg w-full">
                Testi göndər
              </button>
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {activeTab === "notes" && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">Qeydlər</h2>
          <textarea className="textarea h-48" placeholder="Bu dərs haqqında qeydlərini yaz..." value={noteText} onChange={e => setNoteText(e.target.value)} />
          <div className="flex items-center gap-3">
            <button onClick={saveNote} className="btn-primary flex items-center gap-2"><Save size={15} /> Saxla</button>
            {noteSaved && <span className="text-sm text-green-600 font-medium fade-in">✓ Saxlanıldı</span>}
          </div>
        </div>
      )}

      {/* Q&A */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          <div className="card space-y-3">
            <h2 className="font-bold text-gray-900">Yeni sual</h2>
            <div>
              <label className="label">Mövzu</label>
              <input className="input" placeholder="Sualın başlığı..." value={questionText.title} onChange={e => setQuestionText({ ...questionText, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Sual</label>
              <textarea className="textarea h-24" placeholder="Sualını ətraflı yaz..." value={questionText.body} onChange={e => setQuestionText({ ...questionText, body: e.target.value })} />
            </div>
            <button onClick={submitQuestion} disabled={!questionText.title.trim()} className="btn-primary"><Send size={15} /> Göndər</button>
          </div>
          {questionsList.length === 0 ? (
            <div className="card text-center text-muted py-8">Hələ sual yoxdur.</div>
          ) : (
            <div className="space-y-3">
              {questionsList.map((q: any) => (
                <div key={q.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{q.title}</div>
                      <div className="text-sm text-muted mt-0.5">{q.user.name}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`badge ${q.status === "ANSWERED" ? "badge-green" : "badge-gray"}`}>{q.status === "ANSWERED" ? "Cavablandı" : "Açıq"}</div>
                      <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} className="btn-ghost btn-sm">
                        {expandedQ === q.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>
                  {q.body && <p className="text-sm text-gray-700">{q.body}</p>}
                  {expandedQ === q.id && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      {q.replies.map((r: any) => (
                        <div key={r.id} className={cn("rounded-xl p-3 text-sm", r.isTeacher ? "bg-blue-50 border border-blue-100" : "bg-gray-50")}>
                          <div className="font-semibold text-xs mb-1 text-muted">{r.isTeacher ? "👨‍🏫 " : ""}{r.user.name}</div>
                          <div>{r.body}</div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input className="input flex-1" placeholder="Cavab yaz..." value={replyText[q.id] ?? ""} onChange={e => setReplyText({ ...replyText, [q.id]: e.target.value })} />
                        <button onClick={() => submitReply(q.id)} className="btn-primary btn-sm"><Send size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
      const sizes: Record<number, string> = { 2: "text-2xl mt-4", 3: "text-xl mt-3", 4: "text-lg mt-2" };
      const Tag = `h${c.level}` as "h2" | "h3" | "h4";
      return <Tag className={`${sizes[c.level]} font-bold text-gray-900`}>{c.text}</Tag>;
    }

    case "TEXT": {
      const c = parseJson<TextContent>(block.content, { body: "", highlight: "normal" });
      const cls = c.highlight !== "normal" ? `block-text-${c.highlight}` : "";
      return (
        <div className={cls || ""}>
          {block.title && <div className="font-semibold text-gray-800 mb-1.5 text-sm">{block.title}</div>}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</div>
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
          <div className="text-sm leading-relaxed">{c.body}</div>
        </div>
      );
    }

    case "CALLOUT": {
      const c = parseJson<CalloutContent>(block.content, { emoji: "💡", title: "", body: "", color: "blue" });
      const colors: Record<string, string> = {
        blue:   "bg-blue-50 border-blue-200 text-blue-900",
        green:  "bg-green-50 border-green-200 text-green-900",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
        red:    "bg-red-50 border-red-200 text-red-900",
        purple: "bg-purple-50 border-purple-200 text-purple-900",
      };
      return (
        <div className={`rounded-2xl border-2 p-5 ${colors[c.color] ?? colors.blue}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">{c.emoji}</span>
            <div>
              {c.title && <div className="font-bold mb-1">{c.title}</div>}
              <div className="text-sm leading-relaxed">{c.body}</div>
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
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">
                  {i + 1}
                </div>
                {i < c.steps.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 my-1" />}
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
        <div className="card border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-white">
          <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">📋 {block.title ?? "Nümunə"}</div>
          <div className="text-sm text-gray-700 mb-3 leading-relaxed">{c.description}</div>
          {c.relatedImageUrl && <img src={c.relatedImageUrl} className="rounded-xl mb-3 max-h-48 object-cover w-full" alt="" />}
          {c.takeaway && (
            <div className="bg-blue-100 rounded-xl px-4 py-3 text-sm text-blue-900 font-medium flex items-start gap-2">
              <span className="text-green-600 shrink-0 mt-0.5">✅</span> {c.takeaway}
            </div>
          )}
        </div>
      );
    }

    case "TABLE": {
      const c = parseJson<TableContent>(block.content, { headers: [], rows: [] });
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          {block.title && <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-700">{block.title}</div>}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-600">
                {c.headers.map((h, i) => <th key={i} className="px-5 py-3 text-left font-semibold text-white">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row, i) => (
                <tr key={i} className={cn("border-b border-gray-100 transition-colors", i % 2 === 0 ? "bg-white" : "bg-gray-50/50", "hover:bg-blue-50/30")}>
                  {row.map((cell, j) => <td key={j} className="px-5 py-3 text-gray-700">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
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
      const c = parseJson<VideoContent>(block.content, { url: "", caption: "" });
      if (!c.url) return null;
      // Convert YouTube URL to embed
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
                  checked.has(item.id) ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300")}>
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  checked.has(item.id) ? "bg-green-500 border-green-500" : "border-gray-300")}>
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
        <div className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <div className="font-semibold text-orange-800 mb-2 flex items-center gap-2">📝 {block.title ?? "Tapşırıq"}</div>
          <div className="text-sm text-gray-700 mb-3 leading-relaxed">{c.instructions}</div>
          <textarea className="textarea h-28 bg-white" placeholder={c.placeholder}
            defaultValue={existing?.answer ?? ""}
            onChange={e => setTaskAnswers({ ...taskAnswers, [block.id]: e.target.value })} />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={saveTask} disabled={taskSaving} className="btn-primary btn-sm">
              <Send size={13} /> {taskSaving ? "Göndərilir..." : "Göndər"}
            </button>
            {(taskSaved || existing) && <span className="text-xs text-green-600 font-medium">✓ Göndərildi</span>}
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

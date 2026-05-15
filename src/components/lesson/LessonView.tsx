"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle2, BookOpen, MessageCircle,
  FileText, ChevronDown, ChevronUp, Send, Save, Trophy
} from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
import { parseJson } from "@/types/blocks";
import type {
  HeadingContent, TextContent, NoteContent, ExampleContent,
  TableContent, QuizContent, TaskContent, ImageContent
} from "@/types/blocks";

type Props = {
  lesson: any;
  progress: any;
  submissions: any[];
  note: any;
  questions: any[];
  session: any;
};

type Tab = "content" | "quiz" | "notes" | "qa";

export default function LessonView({ lesson, progress, submissions, note, questions, session }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [noteText, setNoteText] = useState(note?.content ?? "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [taskAnswers, setTaskAnswers] = useState<Record<string, string>>({});
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(progress?.completed ?? false);
  const [questionText, setQuestionText] = useState({ title: "", body: "" });
  const [questionsList, setQuestionsList] = useState(questions);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const quizBlock = lesson.blocks.find((b: any) => b.type === "QUIZ");
  const quizContent: QuizContent | null = quizBlock ? parseJson(quizBlock.content, { questions: [] }) : null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "content", label: "Dərs", icon: BookOpen },
    ...(lesson.quizEnabled && quizContent ? [{ key: "quiz" as Tab, label: "Quiz", icon: Trophy }] : []),
    { key: "notes", label: "Qeydlər", icon: FileText },
    { key: "qa", label: `Suallar (${questionsList.length})`, icon: MessageCircle },
  ];

  async function saveNote() {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, content: noteText }),
    });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  async function submitQuiz() {
    if (!quizContent) return;
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, answers: quizAnswers }),
    });
    const data = await res.json();
    setQuizResult(data);
    setQuizSubmitted(true);
  }

  async function completeLesson() {
    setCompleting(true);
    await fetch("/api/progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id }),
    });
    setCompleted(true);
    setCompleting(false);
  }

  async function submitQuestion() {
    if (!questionText.title.trim()) return;
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, ...questionText }),
    });
    const q = await res.json();
    setQuestionsList([{ ...q, user: { name: session.name }, replies: [] }, ...questionsList]);
    setQuestionText({ title: "", body: "" });
  }

  async function submitReply(questionId: string) {
    const body = replyText[questionId];
    if (!body?.trim()) return;
    const res = await fetch(`/api/questions/${questionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const reply = await res.json();
    setQuestionsList(questionsList.map(q =>
      q.id === questionId ? { ...q, replies: [...q.replies, { ...reply, user: { name: session.name } }] } : q
    ));
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
              <div className="flex items-center gap-1 text-xs text-muted">
                <Clock size={13} /> {formatTime(lesson.estimatedMinutes)}
              </div>
              {completed && <div className="badge badge-green"><CheckCircle2 size={12} /> Tamamlandı</div>}
            </div>
          </div>
          {!completed && (
            <button onClick={completeLesson} disabled={completing} className="btn-primary shrink-0">
              {completing ? "..." : "Tamamla"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Content tab */}
      {activeTab === "content" && (
        <div className="space-y-4">
          {lesson.blocks.filter((b: any) => b.type !== "QUIZ").map((block: any) => (
            <BlockRenderer key={block.id} block={block} taskAnswers={taskAnswers} setTaskAnswers={setTaskAnswers} submissions={submissions} lessonId={lesson.id} />
          ))}
        </div>
      )}

      {/* Quiz tab */}
      {activeTab === "quiz" && quizContent && (
        <div className="space-y-6">
          {quizSubmitted && quizResult ? (
            <div className={cn("card text-center", quizResult.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
              <div className="text-4xl font-bold mb-2">{quizResult.score}%</div>
              <div className={cn("text-lg font-semibold", quizResult.passed ? "text-green-700" : "text-red-700")}>
                {quizResult.passed ? "Keçdiniz! 🎉" : "Yenidən cəhd edin"}
              </div>
              {lesson.minQuizScore && (
                <div className="text-sm text-muted mt-1">Keçid balı: {lesson.minQuizScore}%</div>
              )}
              <button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} className="btn-secondary mt-4">
                Yenidən cəhd et
              </button>
            </div>
          ) : (
            <>
              {quizContent.questions.map((q, i) => (
                <div key={q.id} className="card space-y-3">
                  <div className="font-semibold text-gray-900">{i + 1}. {q.text}</div>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: idx })}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                          quizAnswers[q.id] === idx
                            ? "border-blue-400 bg-blue-50 text-blue-800 font-medium"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length < quizContent.questions.length}
                className="btn-primary btn-lg w-full"
              >
                Testi göndər
              </button>
            </>
          )}
        </div>
      )}

      {/* Notes tab */}
      {activeTab === "notes" && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">Qeydlər</h2>
          <textarea
            className="textarea h-48"
            placeholder="Bu dərs haqqında qeydlərini yaz..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button onClick={saveNote} className="btn-primary flex items-center gap-2">
              <Save size={15} /> Saxla
            </button>
            {noteSaved && <span className="text-sm text-green-600 font-medium fade-in">✓ Saxlanıldı</span>}
          </div>
        </div>
      )}

      {/* Q&A tab */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          {/* New question */}
          <div className="card space-y-3">
            <h2 className="font-bold text-gray-900">Yeni sual</h2>
            <div>
              <label className="label">Mövzu</label>
              <input className="input" placeholder="Sualın başlığı..." value={questionText.title}
                onChange={e => setQuestionText({ ...questionText, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Sual</label>
              <textarea className="textarea h-24" placeholder="Sualını ətraflı yaz..."
                value={questionText.body} onChange={e => setQuestionText({ ...questionText, body: e.target.value })} />
            </div>
            <button onClick={submitQuestion} disabled={!questionText.title.trim()} className="btn-primary">
              <Send size={15} /> Göndər
            </button>
          </div>

          {/* Questions list */}
          {questionsList.length === 0 ? (
            <div className="card text-center text-muted py-8">Hələ sual yoxdur. İlk sualı sən ver!</div>
          ) : (
            <div className="space-y-3">
              {questionsList.map(q => (
                <div key={q.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{q.title}</div>
                      <div className="text-sm text-muted mt-0.5">{q.user.name}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`badge ${q.status === "ANSWERED" ? "badge-green" : "badge-gray"}`}>
                        {q.status === "ANSWERED" ? "Cavablandı" : "Açıq"}
                      </div>
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
                        <input className="input flex-1" placeholder="Cavab yaz..."
                          value={replyText[q.id] ?? ""}
                          onChange={e => setReplyText({ ...replyText, [q.id]: e.target.value })} />
                        <button onClick={() => submitReply(q.id)} className="btn-primary btn-sm">
                          <Send size={13} />
                        </button>
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

function BlockRenderer({ block, taskAnswers, setTaskAnswers, submissions, lessonId }: {
  block: any; taskAnswers: Record<string, string>; setTaskAnswers: any; submissions: any[]; lessonId: string;
}) {
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);

  async function saveTask() {
    setTaskSaving(true);
    await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, blockId: block.id, answer: taskAnswers[block.id] }),
    });
    setTaskSaving(false);
    setTaskSaved(true);
    setTimeout(() => setTaskSaved(false), 2000);
  }

  switch (block.type) {
    case "HEADING": {
      const c = parseJson<HeadingContent>(block.content, { text: "", level: 2 });
      const Tag = `h${c.level}` as "h2" | "h3" | "h4";
      const sizes = { 2: "text-2xl", 3: "text-xl", 4: "text-lg" };
      return <Tag className={`${sizes[c.level]} font-bold text-gray-900 mt-2`}>{c.text}</Tag>;
    }
    case "TEXT": {
      const c = parseJson<TextContent>(block.content, { body: "", highlight: "normal" });
      const cls = c.highlight !== "normal" ? `block-text-${c.highlight}` : "";
      return (
        <div className={cls || ""}>
          {block.title && <div className="font-semibold text-gray-700 mb-1.5 text-sm">{block.title}</div>}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{c.body}</div>
        </div>
      );
    }
    case "NOTE": {
      const c = parseJson<NoteContent>(block.content, { variant: "tip", body: "" });
      const icons = { important: "⚠️", tip: "💡", warning: "🔶", remember: "📌" };
      const labels = { important: "Vacib", tip: "Məsləhət", warning: "Diqqət", remember: "Yadda saxla" };
      return (
        <div className={`block-note-${c.variant}`}>
          <div className="font-semibold text-sm mb-1">{icons[c.variant]} {block.title ?? labels[c.variant]}</div>
          <div className="text-sm leading-relaxed">{c.body}</div>
        </div>
      );
    }
    case "EXAMPLE": {
      const c = parseJson<ExampleContent>(block.content, { description: "", takeaway: "", relatedImageUrl: null });
      return (
        <div className="card border-l-4 border-blue-400 bg-blue-50/50">
          <div className="font-semibold text-blue-800 mb-2">📋 {block.title ?? "Nümunə"}</div>
          <div className="text-sm text-gray-700 mb-3">{c.description}</div>
          {c.takeaway && (
            <div className="bg-blue-100/70 rounded-lg px-3 py-2 text-sm text-blue-800 font-medium">
              ✅ {c.takeaway}
            </div>
          )}
        </div>
      );
    }
    case "TABLE": {
      const c = parseJson<TableContent>(block.content, { headers: [], rows: [] });
      return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          {block.title && <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold">{block.title}</div>}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {c.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-gray-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "TASK": {
      const c = parseJson<TaskContent>(block.content, { instructions: "", placeholder: "", required: false });
      const existing = submissions.find(s => s.blockId === block.id);
      return (
        <div className="card border border-orange-200 bg-orange-50/30">
          <div className="font-semibold text-orange-800 mb-2">📝 {block.title ?? "Tapşırıq"}</div>
          <div className="text-sm text-gray-700 mb-3">{c.instructions}</div>
          <textarea
            className="textarea h-28 bg-white"
            placeholder={c.placeholder}
            defaultValue={existing?.answer ?? ""}
            onChange={e => setTaskAnswers({ ...taskAnswers, [block.id]: e.target.value })}
          />
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
      return <hr className="border-gray-200" />;
    case "IMAGE": {
      const c = parseJson<ImageContent>(block.content, { url: "", caption: "", alt: "", alignment: "center" });
      if (!c.url) return null;
      const alignClass = { left: "mr-auto", center: "mx-auto", right: "ml-auto" }[c.alignment];
      return (
        <figure className={`max-w-2xl ${alignClass}`}>
          <img src={c.url} alt={c.alt} className="rounded-xl w-full object-cover" />
          {c.caption && <figcaption className="text-xs text-muted text-center mt-2">{c.caption}</figcaption>}
        </figure>
      );
    }
    default:
      return null;
  }
}

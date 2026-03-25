"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Save,
  Trash2,
  Eye,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  parseJson,
  type HeadingContent,
  type TextContent,
  type ImageContent,
  type ExampleContent,
  type TableContent,
  type QuizContent,
  type QuizQuestion,
  type TaskContent,
  type NoteContent,
} from "@/types/blocks";
import { ImageUploadControl } from "./ImageUploadControl";

export type BuilderBlock = {
  id: string;
  type: string;
  title: string | null;
  content: string;
  settings: string;
  imageUrl: string | null;
  order: number;
};

type ModuleOpt = { id: string; title: string };

type LessonPayload = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  moduleId: string;
  estimatedMinutes: number;
  coverImageUrl: string | null;
  published: boolean;
  quizEnabled: boolean;
  minQuizScore: number | null;
};

const lessonBuilderFetch: RequestInit = { credentials: "include", cache: "no-store" };

const BLOCK_OPTIONS = [
  { type: "HEADING", label: "Başlıq" },
  { type: "TEXT", label: "Mətn" },
  { type: "IMAGE", label: "Şəkil" },
  { type: "EXAMPLE", label: "Nümunə" },
  { type: "TABLE", label: "Cədvəl" },
  { type: "QUIZ", label: "Test" },
  { type: "TASK", label: "Tapşırıq" },
  { type: "NOTE", label: "Qeyd / Callout" },
  { type: "DIVIDER", label: "Ayırıcı" },
] as const;

export function LessonBuilder({
  initialLesson,
  modules,
}: {
  initialLesson: LessonPayload & { blocks: BuilderBlock[] };
  modules: ModuleOpt[];
}) {
  const [lesson, setLesson] = useState(initialLesson);
  const [blocks, setBlocks] = useState<BuilderBlock[]>(
    [...initialLesson.blocks].sort((a, b) => a.order - b.order)
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);

  const reorderRemote = useCallback(
    async (ordered: BuilderBlock[]) => {
      const orderedIds = ordered.map((b) => b.id);
      await fetch(`/api/lessons/${lesson.id}/blocks/reorder`, {
        ...lessonBuilderFetch,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    },
    [lesson.id]
  );

  async function saveLessonMeta() {
    setSavingLesson(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        ...lessonBuilderFetch,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesson.title,
          slug: lesson.slug,
          shortDescription: lesson.shortDescription,
          moduleId: lesson.moduleId,
          estimatedMinutes: lesson.estimatedMinutes,
          coverImageUrl: lesson.coverImageUrl,
          published: lesson.published,
          quizEnabled: lesson.quizEnabled,
          minQuizScore: lesson.minQuizScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Xəta");
        return;
      }
      setLesson((l) => ({ ...l, ...data.lesson }));

      const results = await Promise.all(
        blocks.map(async (block) => {
          const r = await fetch(`/api/lessons/blocks/${block.id}`, {
            ...lessonBuilderFetch,
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: block.title,
              content: block.content,
              settings: block.settings ?? "{}",
              imageUrl: block.imageUrl,
              type: block.type,
            }),
          });
          const json = (await r.json()) as { error?: string; block?: BuilderBlock };
          return { block, r, json };
        })
      );

      for (const { block, r, json } of results) {
        if (!r.ok) {
          setMsg(json.error || `Blok saxlanılmadı (${block.type})`);
          return;
        }
      }

      setBlocks((prev) =>
        prev.map((b) => {
          const row = results.find((x) => x.block.id === b.id);
          if (row?.r.ok && row.json.block) {
            return { ...b, ...row.json.block };
          }
          return b;
        })
      );

      setMsg("Dərs və bütün məzmun blokları yadda saxlanıldı.");
    } finally {
      setSavingLesson(false);
    }
  }

  async function saveBlock(block: BuilderBlock) {
    setMsg(null);
    const res = await fetch(`/api/lessons/blocks/${block.id}`, {
      ...lessonBuilderFetch,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: block.title,
        content: block.content,
        settings: block.settings ?? "{}",
        imageUrl: block.imageUrl,
        type: block.type,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Blok saxlanılmadı");
      return;
    }
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, ...data.block } : b)));
    setMsg("Blok yeniləndi.");
  }

  async function removeBlock(id: string) {
    if (!confirm("Bu bloku silmək istədiyinizə əminsiniz?")) return;
    await fetch(`/api/lessons/blocks/${id}`, { ...lessonBuilderFetch, method: "DELETE" });
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setMsg("Blok silindi.");
  }

  async function dupBlock(id: string) {
    const res = await fetch(`/api/lessons/blocks/${id}`, {
      ...lessonBuilderFetch,
      method: "POST",
      headers: { "x-action": "duplicate" },
    });
    const data = await res.json();
    if (!res.ok) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const next = [...blocks];
    next.splice(idx + 1, 0, data.block as BuilderBlock);
    const reindexed = next.map((b, i) => ({ ...b, order: i }));
    setBlocks(reindexed);
    await reorderRemote(reindexed);
  }

  async function addBlock(type: string) {
    const lastOrder = blocks.length === 0 ? -1 : Math.max(...blocks.map((b) => b.order));
    const res = await fetch(`/api/lessons/${lesson.id}/blocks`, {
      ...lessonBuilderFetch,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, afterOrder: lastOrder }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Blok əlavə olunmadı");
      return;
    }
    setBlocks((prev) => [...prev, data.block].sort((a, b) => a.order - b.order));
    setMsg("Yeni blok əlavə edildi.");
  }

  function updateBlock(id: string, patch: Partial<BuilderBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function moveBlock(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    const t = next[index]!;
    next[index] = next[j]!;
    next[j] = t;
    setBlocks(next);
    await reorderRemote(next);
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur md:-mx-10 md:px-10">
        <Button onClick={saveLessonMeta} disabled={savingLesson}>
          <Save className="mr-2 h-4 w-4" />
          {savingLesson ? "Saxlanır…" : "Hamısını saxla"}
        </Button>
        <Link
          href={`/admin/lessons/${lesson.id}/preview`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Eye className="h-4 w-4" />
          Önizləmə
        </Link>
        <Badge variant={lesson.published ? "success" : "warning"}>
          {lesson.published ? "Dərc edilib" : "Qaralama"}
        </Badge>
        {msg ? <span className="text-sm text-slate-600">{msg}</span> : null}
        {blocks.length > 0 ? (
          <span className="w-full text-xs text-slate-500 md:w-auto md:basis-full md:pl-0">
            «Hamısını saxla» dərs başlığı, modul, örtük şəkli və bütün məzmun bloklarını birlikdə yazır.
          </span>
        ) : null}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Dərs məlumatları</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Başlıq</Label>
            <Input
              value={lesson.title}
              onChange={(e) => setLesson((l) => ({ ...l, title: e.target.value }))}
            />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input
              value={lesson.slug}
              onChange={(e) => setLesson((l) => ({ ...l, slug: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Qısa təsvir</Label>
            <Textarea
              value={lesson.shortDescription ?? ""}
              onChange={(e) => setLesson((l) => ({ ...l, shortDescription: e.target.value || null }))}
              className="min-h-[80px]"
            />
          </div>
          <div>
            <Label>Modul</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={lesson.moduleId}
              onChange={(e) => setLesson((l) => ({ ...l, moduleId: e.target.value }))}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Təxmini müddət (dəq)</Label>
            <Input
              type="number"
              min={5}
              value={lesson.estimatedMinutes}
              onChange={(e) =>
                setLesson((l) => ({ ...l, estimatedMinutes: Number(e.target.value) || 30 }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Örtük şəkli (URL və ya yüklə)</Label>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start">
              <Input
                className="flex-1"
                value={lesson.coverImageUrl ?? ""}
                onChange={(e) => setLesson((l) => ({ ...l, coverImageUrl: e.target.value || null }))}
                placeholder="/uploads/..."
              />
              <ImageUploadControl
                value={lesson.coverImageUrl ?? ""}
                onChange={(url) => setLesson((l) => ({ ...l, coverImageUrl: url }))}
                label="Yüklə"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lesson.published}
                onChange={(e) => setLesson((l) => ({ ...l, published: e.target.checked }))}
              />
              Dərc et
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lesson.quizEnabled}
                onChange={(e) => setLesson((l) => ({ ...l, quizEnabled: e.target.checked }))}
              />
              Test aktiv
            </label>
            <div className="flex items-center gap-2">
              <Label className="mb-0">Min. test balı (%)</Label>
              <Input
                className="w-24"
                type="number"
                min={0}
                max={100}
                value={lesson.minQuizScore ?? ""}
                onChange={(e) =>
                  setLesson((l) => ({
                    ...l,
                    minQuizScore: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Məzmun blokları</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = "";
                if (v) addBlock(v);
              }}
            >
              <option value="" disabled>
                + Blok əlavə et
              </option>
              {BLOCK_OPTIONS.map((o) => (
                <option key={o.type} value={o.type}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            <p className="mb-2 text-4xl">📚</p>
            <p>Hələ blok yoxdur. Yuxarıdan blok növü seçin.</p>
          </div>
        ) : null}

        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition-transform hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-slate-400" />
                <Badge variant="purple">{block.type}</Badge>
                <span className="text-xs text-slate-400">#{index + 1}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => moveBlock(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => moveBlock(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => dupBlock(block.id)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => removeBlock(block.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => saveBlock(block)}>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  Saxla
                </Button>
              </div>
            </div>

            <BlockFields block={block} update={(p) => updateBlock(block.id, p)} />

            <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
              <Label>Bölmədən sonra şəkil (istəyə bağlı)</Label>
              <p className="mb-2 text-xs text-slate-500">Slayd tipli vizual üçün blok altına şəkil əlavə edin.</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  className="flex-1"
                  value={block.imageUrl ?? ""}
                  onChange={(e) => updateBlock(block.id, { imageUrl: e.target.value || null })}
                  placeholder="/uploads/..."
                />
                <ImageUploadControl
                  value={block.imageUrl ?? ""}
                  onChange={(url) => updateBlock(block.id, { imageUrl: url })}
                />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function BlockFields({
  block,
  update,
}: {
  block: BuilderBlock;
  update: (p: Partial<BuilderBlock>) => void;
}) {
  switch (block.type) {
    case "HEADING": {
      const c = parseJson<HeadingContent>(block.content, { text: "", level: 2 });
      return (
        <div className="space-y-3">
          <div>
            <Label>Mətn</Label>
            <Input
              value={c.text}
              onChange={(e) =>
                update({ content: JSON.stringify({ ...c, text: e.target.value }) })
              }
            />
          </div>
          <div>
            <Label>Səviyyə</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={c.level}
              onChange={(e) =>
                update({
                  content: JSON.stringify({ ...c, level: Number(e.target.value) as 2 | 3 | 4 }),
                })
              }
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
            </select>
          </div>
        </div>
      );
    }
    case "TEXT": {
      const c = parseJson<TextContent>(block.content, { body: "", highlight: "normal" });
      return (
        <div className="space-y-3">
          <div>
            <Label>Alt başlıq (istəyə bağlı)</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => update({ title: e.target.value || null })}
            />
          </div>
          <div>
            <Label>Məzmun</Label>
            <Textarea
              value={c.body}
              onChange={(e) => update({ content: JSON.stringify({ ...c, body: e.target.value }) })}
            />
          </div>
          <div>
            <Label>Vurğu</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={c.highlight}
              onChange={(e) =>
                update({
                  content: JSON.stringify({
                    ...c,
                    highlight: e.target.value as TextContent["highlight"],
                  }),
                })
              }
            >
              <option value="normal">Normal</option>
              <option value="info">Məlumat</option>
              <option value="warning">Xəbərdarlıq</option>
              <option value="success">Uğur</option>
            </select>
          </div>
        </div>
      );
    }
    case "IMAGE": {
      const c = parseJson<ImageContent>(block.content, {
        url: "",
        caption: "",
        alt: "",
        alignment: "center",
      });
      return (
        <div className="space-y-3">
          <ImageUploadControl
            value={c.url}
            onChange={(url) => update({ content: JSON.stringify({ ...c, url }) })}
          />
          <div>
            <Label>Alt mətn</Label>
            <Input
              value={c.alt}
              onChange={(e) => update({ content: JSON.stringify({ ...c, alt: e.target.value }) })}
            />
          </div>
          <div>
            <Label>Altyazı</Label>
            <Input
              value={c.caption}
              onChange={(e) => update({ content: JSON.stringify({ ...c, caption: e.target.value }) })}
            />
          </div>
          <div>
            <Label>Üfüqi düzülüş</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={c.alignment}
              onChange={(e) =>
                update({
                  content: JSON.stringify({
                    ...c,
                    alignment: e.target.value as ImageContent["alignment"],
                  }),
                })
              }
            >
              <option value="left">Sol</option>
              <option value="center">Mərkəz</option>
              <option value="right">Sağ</option>
            </select>
          </div>
        </div>
      );
    }
    case "EXAMPLE": {
      const c = parseJson<ExampleContent>(block.content, {
        description: "",
        takeaway: "",
        relatedImageUrl: null,
      });
      return (
        <div className="space-y-3">
          <div>
            <Label>Başlıq</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => update({ title: e.target.value || null })}
            />
          </div>
          <div>
            <Label>Təsvir</Label>
            <Textarea
              value={c.description}
              onChange={(e) => update({ content: JSON.stringify({ ...c, description: e.target.value }) })}
            />
          </div>
          <div>
            <Label>Nəticə / takeaway</Label>
            <Textarea
              className="min-h-[72px]"
              value={c.takeaway}
              onChange={(e) => update({ content: JSON.stringify({ ...c, takeaway: e.target.value }) })}
            />
          </div>
          <div>
            <Label>Əlaqəli şəkil</Label>
            <ImageUploadControl
              value={c.relatedImageUrl ?? ""}
              onChange={(url) =>
                update({ content: JSON.stringify({ ...c, relatedImageUrl: url || null }) })
              }
            />
          </div>
        </div>
      );
    }
    case "TABLE": {
      const c = parseJson<TableContent>(block.content, { headers: ["A", "B"], rows: [["", ""]] });
      const setTable = (next: TableContent) => update({ content: JSON.stringify(next) });
      return (
        <div className="space-y-3">
          <div>
            <Label>Başlıq</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => update({ title: e.target.value || null })}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr>
                  {c.headers.map((h, i) => (
                    <th key={i} className="border border-slate-200 bg-slate-50 p-1">
                      <Input
                        className="h-8 text-xs"
                        value={h}
                        onChange={(e) => {
                          const headers = [...c.headers];
                          headers[i] = e.target.value;
                          setTable({ ...c, headers });
                        }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-slate-200 p-1">
                        <Input
                          className="h-8 text-xs"
                          value={cell}
                          onChange={(e) => {
                            const rows = c.rows.map((r) => [...r]);
                            rows[ri]![ci] = e.target.value;
                            setTable({ ...c, rows });
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTable({ ...c, rows: [...c.rows, c.headers.map(() => "")] })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              Sətir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (c.rows.length <= 1) return;
                setTable({ ...c, rows: c.rows.slice(0, -1) });
              }}
            >
              Sətir sil
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTable({
                  ...c,
                  headers: [...c.headers, `Sütun ${c.headers.length + 1}`],
                  rows: c.rows.map((r) => [...r, ""]),
                })
              }
            >
              Sütun
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (c.headers.length <= 1) return;
                setTable({
                  ...c,
                  headers: c.headers.slice(0, -1),
                  rows: c.rows.map((r) => r.slice(0, -1)),
                });
              }}
            >
              Sütun sil
            </Button>
          </div>
        </div>
      );
    }
    case "QUIZ": {
      const c = parseJson<QuizContent>(block.content, { questions: [] });
      const qs = c.questions?.length ? c.questions : [];
      const setQ = (questions: QuizQuestion[]) => update({ content: JSON.stringify({ questions }) });
      return (
        <div className="space-y-4">
          <div>
            <Label>Blok başlığı</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => update({ title: e.target.value || null })}
            />
          </div>
          {qs.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-2 flex justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">Sual {qi + 1}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      if (qi === 0) return;
                      const next = [...qs];
                      const t = next[qi]!;
                      next[qi] = next[qi - 1]!;
                      next[qi - 1] = t;
                      setQ(next);
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      if (qi >= qs.length - 1) return;
                      const next = [...qs];
                      const t = next[qi]!;
                      next[qi] = next[qi + 1]!;
                      next[qi + 1] = t;
                      setQ(next);
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-red-600"
                    onClick={() => setQ(qs.filter((_, i) => i !== qi))}
                  >
                    Sil
                  </Button>
                </div>
              </div>
              <Label className="text-xs">Sual</Label>
              <Textarea
                className="mb-2 min-h-[64px]"
                value={q.text}
                onChange={(e) => {
                  const next = [...qs];
                  next[qi] = { ...q, text: e.target.value };
                  setQ(next);
                }}
              />
              {[0, 1, 2, 3].map((oi) => (
                <div key={oi} className="mb-1 flex items-center gap-2">
                  <span className="w-16 text-xs text-slate-500">{String.fromCharCode(65 + oi)}</span>
                  <Input
                    value={q.options[oi] ?? ""}
                    onChange={(e) => {
                      const next = [...qs];
                      const opts = [...next[qi]!.options] as [string, string, string, string];
                      opts[oi] = e.target.value;
                      next[qi] = { ...q, options: opts };
                      setQ(next);
                    }}
                  />
                </div>
              ))}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Düzgün cavab</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                    value={q.correctIndex}
                    onChange={(e) => {
                      const next = [...qs];
                      next[qi] = { ...q, correctIndex: Number(e.target.value) };
                      setQ(next);
                    }}
                  >
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Şəkil (URL)</Label>
                  <Input
                    value={q.imageUrl ?? ""}
                    onChange={(e) => {
                      const next = [...qs];
                      next[qi] = { ...q, imageUrl: e.target.value || null };
                      setQ(next);
                    }}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs">İzah</Label>
                <Textarea
                  className="min-h-[56px]"
                  value={q.explanation ?? ""}
                  onChange={(e) => {
                    const next = [...qs];
                    next[qi] = { ...q, explanation: e.target.value };
                    setQ(next);
                  }}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setQ([
                ...qs,
                {
                  id: crypto.randomUUID(),
                  text: "",
                  options: ["", "", "", ""] as [string, string, string, string],
                  correctIndex: 0,
                  explanation: "",
                  imageUrl: null,
                },
              ])
            }
          >
            <Plus className="mr-1 h-3 w-3" />
            Sual əlavə et
          </Button>
        </div>
      );
    }
    case "TASK": {
      const c = parseJson<TaskContent>(block.content, {
        instructions: "",
        placeholder: "",
        required: false,
      });
      return (
        <div className="space-y-3">
          <div>
            <Label>Başlıq</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => update({ title: e.target.value || null })}
            />
          </div>
          <div>
            <Label>Təlimat</Label>
            <Textarea
              value={c.instructions}
              onChange={(e) => update({ content: JSON.stringify({ ...c, instructions: e.target.value }) })}
            />
          </div>
          <div>
            <Label>Placeholder</Label>
            <Input
              value={c.placeholder}
              onChange={(e) => update({ content: JSON.stringify({ ...c, placeholder: e.target.value }) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={c.required}
              onChange={(e) => update({ content: JSON.stringify({ ...c, required: e.target.checked }) })}
            />
            Məcburi tapşırıq
          </label>
        </div>
      );
    }
    case "NOTE": {
      const c = parseJson<NoteContent>(block.content, { variant: "tip", body: "" });
      return (
        <div className="space-y-3">
          <div>
            <Label>Başlıq</Label>
            <Input
              value={block.title ?? ""}
              onChange={(e) => update({ title: e.target.value || null })}
            />
          </div>
          <div>
            <Label>Növ</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={c.variant}
              onChange={(e) =>
                update({
                  content: JSON.stringify({
                    ...c,
                    variant: e.target.value as NoteContent["variant"],
                  }),
                })
              }
            >
              <option value="important">Vacib</option>
              <option value="remember">Xatırla</option>
              <option value="tip">Məsləhət</option>
              <option value="warning">Xəbərdarlıq</option>
            </select>
          </div>
          <div>
            <Label>Mətn</Label>
            <Textarea value={c.body} onChange={(e) => update({ content: JSON.stringify({ ...c, body: e.target.value }) })} />
          </div>
        </div>
      );
    }
    case "DIVIDER":
      return <p className="text-sm text-slate-500">Vizual ayırıcı — əlavə parametrlər yoxdur.</p>;
    default:
      return (
        <div>
          <Label>Məzmun (JSON)</Label>
          <Textarea
            className="font-mono text-xs"
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
          />
        </div>
      );
  }
}

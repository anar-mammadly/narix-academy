"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Save, Eye,
  GripVertical, Type, AlignLeft, Image, Table,
  HelpCircle, ClipboardList, AlertCircle, Minus, BookOpen,
  Video, Code, CheckSquare, GitBranch, Megaphone, ListOrdered
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoBlockEditor } from "@/components/admin/VideoBlockEditor";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BLOCK_META: Record<string, { label: string; icon: any; color: string }> = {
  HEADING:  { label: "Başlıq",     icon: Type,          color: "bg-purple-100 text-purple-700" },
  TEXT:     { label: "Mətn",       icon: AlignLeft,     color: "bg-blue-100 text-blue-700" },
  NOTE:     { label: "Qeyd",       icon: AlertCircle,   color: "bg-yellow-100 text-yellow-700" },
  CALLOUT:  { label: "Callout",    icon: Megaphone,     color: "bg-pink-100 text-pink-700" },
  EXAMPLE:  { label: "Nümunə",     icon: BookOpen,      color: "bg-green-100 text-green-700" },
  STEPPER:  { label: "Addımlar",   icon: ListOrdered,   color: "bg-indigo-100 text-indigo-700" },
  TABLE:    { label: "Cədvəl",     icon: Table,         color: "bg-cyan-100 text-cyan-700" },
  IMAGE:    { label: "Şəkil",      icon: Image,         color: "bg-rose-100 text-rose-700" },
  VIDEO:    { label: "Video",      icon: Video,         color: "bg-red-100 text-red-700" },
  CODE:     { label: "Kod",        icon: Code,          color: "bg-gray-100 text-gray-700" },
  DIAGRAM:  { label: "Diaqram",    icon: GitBranch,     color: "bg-teal-100 text-teal-700" },
  CHECKLIST:{ label: "Siyahı",     icon: CheckSquare,   color: "bg-lime-100 text-lime-700" },
  QUIZ:     { label: "Quiz",       icon: HelpCircle,    color: "bg-orange-100 text-orange-700" },
  TASK:     { label: "Tapşırıq",   icon: ClipboardList, color: "bg-amber-100 text-amber-700" },
  DIVIDER:  { label: "Ayırıcı",    icon: Minus,         color: "bg-gray-100 text-gray-500" },
};

const BLOCK_DEFAULTS: Record<string, object> = {
  HEADING:   { text: "Yeni başlıq", level: 2 },
  TEXT:      { body: "Mətn buraya yazın...", highlight: "normal" },
  NOTE:      { variant: "tip", body: "Qeyd mətni..." },
  CALLOUT:   { emoji: "💡", title: "Başlıq", body: "İzahat mətni...", color: "blue" },
  EXAMPLE:   { description: "Nümunənin izahatı...", takeaway: "Əsas çıxarış...", relatedImageUrl: null },
  STEPPER:   { steps: [{ title: "Addım 1", description: "İzahat..." }, { title: "Addım 2", description: "İzahat..." }] },
  TABLE:     { headers: ["Sütun 1", "Sütun 2", "Sütun 3"], rows: [["Dəyər", "Dəyər", "Dəyər"]] },
  IMAGE:     { url: "", caption: "", alt: "", alignment: "center" },
  VIDEO:     { url: "", source: "external", caption: "" },
  CODE:      { code: "# Kodu buraya yazın\necho 'Hello World'", language: "bash" },
  DIAGRAM:   { code: "flowchart TD\n    A[Başlayır] --> B[Proses]\n    B --> C[Bitir]", caption: "" },
  CHECKLIST: { items: [{ id: "item-1", text: "Birinci maddə" }, { id: "item-2", text: "İkinci maddə" }] },
  QUIZ:      { questions: [{ id: `q-${Date.now()}`, text: "Sual mətni?", options: ["Variant A", "Variant B", "Variant C", "Variant D"], correctIndex: 0, explanation: "" }] },
  TASK:      { instructions: "Tapşırığın şərtləri...", placeholder: "Cavabınızı buraya yazın...", required: true },
  DIVIDER:   {},
};

export default function LessonEditor({ lesson }: { lesson: any }) {
  const [meta, setMeta] = useState({
    title: lesson.title, titleEn: lesson.titleEn ?? "",
    shortDescription: lesson.shortDescription ?? "",
    estimatedMinutes: lesson.estimatedMinutes,
    published: lesson.published, quizEnabled: lesson.quizEnabled,
    minQuizScore: lesson.minQuizScore ?? 60,
  });
  const [blocks, setBlocks] = useState<any[]>(lesson.blocks);
  const [metaSaved, setMetaSaved] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadForBlock = useRef<string | null>(null);

  async function saveMeta() {
    setMetaSaving(true);
    await fetch(`/api/lessons/${lesson.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(meta) });
    setMetaSaving(false); setMetaSaved(true); setTimeout(() => setMetaSaved(false), 2000);
  }

  async function addBlock(type: string) {
    const res = await fetch(`/api/lessons/${lesson.id}/blocks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content: JSON.stringify(BLOCK_DEFAULTS[type] ?? {}), title: null }),
    });
    const block = await res.json();
    setBlocks([...blocks, block]);
    setActiveBlock(block.id);
    setShowAddBlock(false);
  }

  async function updateBlock(blockId: string, content: object, title?: string | null) {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const updated = { ...block, content: JSON.stringify(content), title: title !== undefined ? title : block.title };
    setBlocks(blocks.map(b => b.id === blockId ? updated : b));
    await fetch(`/api/lessons/blocks/${blockId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: JSON.stringify(content), title: title !== undefined ? title : block.title }),
    });
  }

  async function deleteBlock(blockId: string) {
    if (!confirm("Bu bloku silmək istədiyinizdən əminsiniz?")) return;
    await fetch(`/api/lessons/blocks/${blockId}`, { method: "DELETE" });
    setBlocks(blocks.filter(b => b.id !== blockId));
    if (activeBlock === blockId) setActiveBlock(null);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);
    await Promise.all(
      reordered.map((b, i) =>
        fetch(`/api/lessons/blocks/${b.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: i }),
        })
      )
    );
  }

  async function handleImageUpload(blockId: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploadingImage(blockId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: fd });
    const { url } = await res.json();
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const c = JSON.parse(block.content);
      await updateBlock(blockId, { ...c, url });
    }
    setUploadingImage(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function parse(block: any) {
    try { return JSON.parse(block.content); } catch { return {}; }
  }

  return (
    <div className="max-w-4xl fade-in">
      <input type="file" ref={fileRef} className="hidden" accept="image/*"
        onChange={() => uploadForBlock.current && handleImageUpload(uploadForBlock.current)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/modules/${lesson.module.id}/edit`}
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-2">
            <ArrowLeft size={15} /> {lesson.module.title}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 truncate max-w-lg">{lesson.title}</h1>
        </div>
        <Link href={`/dashboard/lessons/${lesson.slug}`} target="_blank" className="btn-secondary btn-sm">
          <Eye size={14} /> Önizlə
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Blocks */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Bloklar ({blocks.length})</h2>
            <button onClick={() => setShowAddBlock(!showAddBlock)} className="btn-primary btn-sm">
              <Plus size={14} /> Blok əlavə et
            </button>
          </div>

          {showAddBlock && (
            <div className="card slide-up p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Blok növünü seç:</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BLOCK_META).map(([type, { label, icon: Icon, color }]) => (
                  <button key={type} onClick={() => addBlock(type)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700 text-left">
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                      <Icon size={14} />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {blocks.length === 0 && (
            <div className="card text-center text-muted py-10">Blok əlavə et düyməsinə bas</div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => {
                const c = parse(block);
                const isActive = activeBlock === block.id;
                return (
                  <SortableBlockRow
                    key={block.id}
                    block={block}
                    isActive={isActive}
                    onToggle={() => setActiveBlock(isActive ? null : block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  >
                    {!isActive && <BlockPreview block={block} content={c} />}
                    {isActive && (
                      <div className="border-t border-gray-100 pt-3 space-y-3">
                        <BlockEditor block={block} content={c} onChange={(nc: object, t: string) => updateBlock(block.id, nc, t)}
                          onImageUpload={() => { uploadForBlock.current = block.id; fileRef.current?.click(); }}
                          uploadingImage={uploadingImage === block.id} />
                      </div>
                    )}
                  </SortableBlockRow>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {/* Meta panel */}
        <div>
          <div className="card space-y-4 sticky top-4">
            <h2 className="font-bold text-gray-900">Dərs ayarları</h2>
            <div>
              <label className="label">Başlıq (AZ)</label>
              <input className="input text-sm" value={meta.title} onChange={e => setMeta({ ...meta, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Başlıq (EN)</label>
              <input className="input text-sm" value={meta.titleEn} onChange={e => setMeta({ ...meta, titleEn: e.target.value })} />
            </div>
            <div>
              <label className="label">Qısa təsvir</label>
              <textarea className="textarea h-16 text-sm" value={meta.shortDescription} onChange={e => setMeta({ ...meta, shortDescription: e.target.value })} />
            </div>
            <div>
              <label className="label">Müddət (dəq)</label>
              <input type="number" className="input text-sm" min={5} max={300} value={meta.estimatedMinutes} onChange={e => setMeta({ ...meta, estimatedMinutes: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={meta.published} onChange={e => setMeta({ ...meta, published: e.target.checked })} />
                <span className="text-sm font-medium text-gray-700">Yayımlanıb</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={meta.quizEnabled} onChange={e => setMeta({ ...meta, quizEnabled: e.target.checked })} />
                <span className="text-sm font-medium text-gray-700">Quiz aktiv</span>
              </label>
            </div>
            {meta.quizEnabled && (
              <div>
                <label className="label">Min. keçid balı (%)</label>
                <input type="number" className="input text-sm" min={0} max={100} value={meta.minQuizScore} onChange={e => setMeta({ ...meta, minQuizScore: parseInt(e.target.value) })} />
              </div>
            )}
            <button onClick={saveMeta} disabled={metaSaving} className="btn-primary w-full">
              <Save size={14} /> {metaSaving ? "Saxlanılır..." : "Saxla"}
            </button>
            {metaSaved && <div className="text-center text-sm text-green-600 font-medium fade-in">✓ Saxlanıldı</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableBlockRow({
  block, isActive, onToggle, onDelete, children,
}: { block: any; isActive: boolean; onToggle: () => void; onDelete: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const bm = BLOCK_META[block.type] ?? BLOCK_META.TEXT;
  const Icon = bm.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("card transition-all", isActive && "ring-2 ring-blue-400 shadow-md", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-2 mb-2">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing shrink-0">
          <GripVertical size={15} />
        </button>
        <div className={`w-7 h-7 rounded-lg ${bm.color} flex items-center justify-center shrink-0 cursor-pointer`} onClick={onToggle}>
          <Icon size={14} />
        </div>
        <span className="text-sm font-semibold text-gray-700 flex-1 cursor-pointer" onClick={onToggle}>{bm.label}</span>
        {block.title && <span className="text-xs text-muted truncate max-w-28">{block.title}</span>}
        <button onClick={onDelete} className="btn-ghost btn-sm py-1 px-1.5 text-red-400 hover:text-red-600 ml-auto"><Trash2 size={13} /></button>
      </div>
      {children}
    </div>
  );
}

function BlockPreview({ block, content: c }: { block: any; content: any }) {
  switch (block.type) {
    case "HEADING":   return <div className={`font-bold text-gray-700 ${c.level === 2 ? "text-lg" : "text-base"}`}>{c.text}</div>;
    case "TEXT":      return <div className="text-sm text-gray-600 line-clamp-2">{c.body}</div>;
    case "NOTE":      return <div className="text-sm text-gray-600">📌 {c.body}</div>;
    case "CALLOUT":   return <div className="text-sm text-gray-600">{c.emoji} {c.title} — {c.body}</div>;
    case "EXAMPLE":   return <div className="text-sm text-gray-600">📋 {c.description}</div>;
    case "STEPPER":   return <div className="text-sm text-muted">{c.steps?.length ?? 0} addım</div>;
    case "TABLE":     return <div className="text-sm text-muted">{c.headers?.join(" | ")}</div>;
    case "IMAGE":     return c.url ? <img src={c.url} className="max-h-16 rounded-lg object-cover" alt="" /> : <div className="text-sm text-muted italic">Şəkil seçilməyib</div>;
    case "VIDEO":
      return c.url
        ? c.source === "upload"
          ? <video src={c.url} className="max-h-16 rounded-lg object-cover" muted />
          : <div className="text-sm text-muted">🎬 {c.url}</div>
        : <div className="text-sm text-muted italic">Video seçilməyib</div>;
    case "CODE":      return <div className="text-sm font-mono text-gray-500 bg-gray-50 rounded px-2 py-1 truncate">{c.code?.slice(0, 60)}...</div>;
    case "DIAGRAM":   return <div className="text-sm text-muted">📊 Mermaid diaqram</div>;
    case "CHECKLIST": return <div className="text-sm text-muted">☑ {c.items?.length ?? 0} maddə</div>;
    case "QUIZ":      return <div className="text-sm text-muted">{c.questions?.length ?? 0} sual</div>;
    case "TASK":      return <div className="text-sm text-gray-600 line-clamp-1">{c.instructions}</div>;
    case "DIVIDER":   return <hr className="border-gray-200" />;
    default:          return null;
  }
}

function BlockEditor({ block, content: c, onChange, onImageUpload, uploadingImage }: any) {
  switch (block.type) {
    case "HEADING":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq mətni</label>
            <input className="input" value={c.text ?? ""} onChange={e => onChange({ ...c, text: e.target.value })} /></div>
          <div><label className="label">Səviyyə</label>
            <div className="flex gap-2">
              {[2,3,4].map(l => (
                <button key={l} onClick={() => onChange({ ...c, level: l })}
                  className={cn("btn-secondary btn-sm", c.level === l && "bg-blue-700 text-white border-blue-700")}>H{l}</button>
              ))}
            </div>
          </div>
        </div>
      );

    case "TEXT":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq (isteğe bağlı)</label>
            <input className="input" placeholder="Bölmə başlığı..." value={block.title ?? ""} onChange={e => onChange(c, e.target.value)} /></div>
          <div><label className="label">Mətn</label>
            <textarea className="textarea h-32" value={c.body ?? ""} onChange={e => onChange({ ...c, body: e.target.value })} /></div>
          <div><label className="label">Vurğu</label>
            <div className="flex gap-2 flex-wrap">
              {[["normal","Yox"],["info","Məlumat"],["warning","Xəbərdarlıq"],["success","Uğur"]].map(([v,l]) => (
                <button key={v} onClick={() => onChange({ ...c, highlight: v })}
                  className={cn("btn-secondary btn-sm", c.highlight === v && "bg-blue-700 text-white border-blue-700")}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      );

    case "NOTE":
      return (
        <div className="space-y-3">
          <div><label className="label">Növ</label>
            <div className="flex gap-2 flex-wrap">
              {[["important","⚠️ Vacib"],["tip","💡 Məsləhət"],["warning","🔶 Diqqət"],["remember","📌 Yadda saxla"]].map(([v,l]) => (
                <button key={v} onClick={() => onChange({ ...c, variant: v })}
                  className={cn("btn-secondary btn-sm", c.variant === v && "bg-blue-700 text-white border-blue-700")}>{l}</button>
              ))}
            </div>
          </div>
          <div><label className="label">Mətn</label>
            <textarea className="textarea h-20" value={c.body ?? ""} onChange={e => onChange({ ...c, body: e.target.value })} /></div>
        </div>
      );

    case "CALLOUT":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Emoji</label>
              <input className="input" value={c.emoji ?? "💡"} onChange={e => onChange({ ...c, emoji: e.target.value })} /></div>
            <div><label className="label">Rəng</label>
              <select className="input" value={c.color ?? "blue"} onChange={e => onChange({ ...c, color: e.target.value })}>
                {["blue","green","yellow","red","purple"].map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Başlıq</label>
            <input className="input" value={c.title ?? ""} onChange={e => onChange({ ...c, title: e.target.value })} /></div>
          <div><label className="label">Mətn</label>
            <textarea className="textarea h-20" value={c.body ?? ""} onChange={e => onChange({ ...c, body: e.target.value })} /></div>
        </div>
      );

    case "STEPPER":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq</label>
            <input className="input" placeholder="Proses adı..." value={block.title ?? ""} onChange={e => onChange(c, e.target.value)} /></div>
          {(c.steps ?? []).map((step: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Addım {i+1}</span>
                <button onClick={() => onChange({ ...c, steps: c.steps.filter((_:any,j:number) => j !== i) })} className="btn-ghost btn-sm text-red-400 py-0.5"><Trash2 size={12}/></button>
              </div>
              <input className="input text-sm" placeholder="Addım adı..." value={step.title}
                onChange={e => { const s=[...c.steps]; s[i]={...step,title:e.target.value}; onChange({...c,steps:s}); }} />
              <textarea className="textarea h-14 text-sm" placeholder="İzahat..." value={step.description}
                onChange={e => { const s=[...c.steps]; s[i]={...step,description:e.target.value}; onChange({...c,steps:s}); }} />
            </div>
          ))}
          <button onClick={() => onChange({ ...c, steps: [...(c.steps??[]), { title: `Addım ${(c.steps?.length??0)+1}`, description: "" }] })}
            className="btn-secondary btn-sm w-full"><Plus size={13}/> Addım əlavə et</button>
        </div>
      );

    case "EXAMPLE":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq</label>
            <input className="input" value={block.title ?? ""} onChange={e => onChange(c, e.target.value)} /></div>
          <div><label className="label">İzahat</label>
            <textarea className="textarea h-20" value={c.description ?? ""} onChange={e => onChange({ ...c, description: e.target.value })} /></div>
          <div><label className="label">Əsas çıxarış</label>
            <input className="input" value={c.takeaway ?? ""} onChange={e => onChange({ ...c, takeaway: e.target.value })} /></div>
        </div>
      );

    case "TABLE":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq</label>
            <input className="input" value={block.title ?? ""} onChange={e => onChange(c, e.target.value)} /></div>
          <div><label className="label">Sütunlar (vergüllə ayır)</label>
            <input className="input" value={(c.headers??[]).join(", ")}
              onChange={e => onChange({ ...c, headers: e.target.value.split(",").map((s:string)=>s.trim()) })} /></div>
          <div>
            <label className="label">Cərgələr</label>
            {(c.rows??[]).map((row:string[],ri:number)=>(
              <div key={ri} className="flex gap-2 mb-2">
                <input className="input text-sm flex-1" value={row.join(", ")}
                  onChange={e => { const rows=[...(c.rows??[])]; rows[ri]=e.target.value.split(",").map((s:string)=>s.trim()); onChange({...c,rows}); }}/>
                <button onClick={() => onChange({...c,rows:(c.rows??[]).filter((_:any,i:number)=>i!==ri)})} className="btn-ghost btn-sm text-red-400"><Trash2 size={13}/></button>
              </div>
            ))}
            <button onClick={() => onChange({...c,rows:[...(c.rows??[]),Array(c.headers?.length??2).fill("")]})} className="btn-secondary btn-sm mt-1"><Plus size={13}/> Cərgə əlavə et</button>
          </div>
        </div>
      );

    case "IMAGE":
      return (
        <div className="space-y-3">
          <div><label className="label">Şəkil URL və ya yüklə</label>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="https://..." value={c.url ?? ""} onChange={e => onChange({...c,url:e.target.value})}/>
              <button onClick={onImageUpload} disabled={uploadingImage} className="btn-secondary btn-sm shrink-0">
                {uploadingImage ? "Yüklənir..." : "Yüklə"}
              </button>
            </div>
            {c.url && <img src={c.url} className="mt-2 max-h-32 rounded-xl object-cover" alt="preview"/>}
          </div>
          <div><label className="label">Başlıq</label>
            <input className="input" value={c.caption??""} onChange={e=>onChange({...c,caption:e.target.value})}/></div>
          <div><label className="label">Hizalanma</label>
            <div className="flex gap-2">
              {[["left","Sol"],["center","Mərkəz"],["right","Sağ"]].map(([a,l])=>(
                <button key={a} onClick={()=>onChange({...c,alignment:a})}
                  className={cn("btn-secondary btn-sm",c.alignment===a&&"bg-blue-700 text-white border-blue-700")}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      );

    case "VIDEO":
      return (
        <div className="space-y-3">
          <VideoBlockEditor content={c} onChange={(nc) => onChange(nc, block.title)} />
          <div><label className="label">Başlıq</label>
            <input className="input" value={block.title??""} onChange={e=>onChange(c,e.target.value)}/></div>
          <div><label className="label">Qeyd</label>
            <input className="input" value={c.caption??""} onChange={e=>onChange({...c,caption:e.target.value})}/></div>
        </div>
      );

    case "CODE":
      return (
        <div className="space-y-3">
          <div><label className="label">Dil</label>
            <select className="input" value={c.language??"bash"} onChange={e=>onChange({...c,language:e.target.value})}>
              {["bash","javascript","typescript","python","sql","json","html","css","yaml","plaintext"].map(l=>(
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div><label className="label">Kod</label>
            <textarea className="textarea h-40 font-mono text-sm" value={c.code??""} onChange={e=>onChange({...c,code:e.target.value})}/></div>
          <div><label className="label">Qeyd</label>
            <input className="input" value={c.caption??""} onChange={e=>onChange({...c,caption:e.target.value})}/></div>
        </div>
      );

    case "DIAGRAM":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq</label>
            <input className="input" value={block.title??""} onChange={e=>onChange(c,e.target.value)}/></div>
          <div>
            <label className="label">Mermaid kodu</label>
            <textarea className="textarea h-36 font-mono text-sm" value={c.code??""} onChange={e=>onChange({...c,code:e.target.value})}/>
            <div className="text-xs text-muted mt-1">Nümunə: <code className="font-mono bg-gray-100 px-1 rounded">flowchart TD, sequenceDiagram, classDiagram</code></div>
          </div>
          <div><label className="label">Qeyd</label>
            <input className="input" value={c.caption??""} onChange={e=>onChange({...c,caption:e.target.value})}/></div>
        </div>
      );

    case "CHECKLIST":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq</label>
            <input className="input" value={block.title??""} onChange={e=>onChange(c,e.target.value)}/></div>
          <div className="space-y-2">
            {(c.items??[]).map((item:any,i:number)=>(
              <div key={item.id} className="flex gap-2">
                <input className="input text-sm flex-1" value={item.text}
                  onChange={e=>{const items=[...(c.items??[])];items[i]={...item,text:e.target.value};onChange({...c,items});}}/>
                <button onClick={()=>onChange({...c,items:(c.items??[]).filter((_:any,j:number)=>j!==i)})} className="btn-ghost btn-sm text-red-400"><Trash2 size={13}/></button>
              </div>
            ))}
            <button onClick={()=>onChange({...c,items:[...(c.items??[]),{id:`item-${Date.now()}`,text:"Yeni maddə"}]})} className="btn-secondary btn-sm w-full">
              <Plus size={13}/> Maddə əlavə et</button>
          </div>
        </div>
      );

    case "QUIZ":
      return (
        <div className="space-y-4">
          {(c.questions??[]).map((q:any,qi:number)=>(
            <div key={q.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-700">Sual {qi+1}</span>
                <button onClick={()=>onChange({...c,questions:c.questions.filter((_:any,i:number)=>i!==qi)})} className="btn-ghost btn-sm text-red-400"><Trash2 size={13}/></button>
              </div>
              <input className="input text-sm" placeholder="Sual mətni..." value={q.text}
                onChange={e=>{const qs=[...c.questions];qs[qi]={...q,text:e.target.value};onChange({...c,questions:qs});}}/>
              <div className="space-y-1.5">
                {(q.options??[]).map((opt:string,oi:number)=>(
                  <div key={oi} className="flex items-center gap-2">
                    <button onClick={()=>{const qs=[...c.questions];qs[qi]={...q,correctIndex:oi};onChange({...c,questions:qs});}}
                      className={cn("w-5 h-5 rounded-full border-2 shrink-0 transition-colors",q.correctIndex===oi?"border-green-500 bg-green-500":"border-gray-300")}/>
                    <input className="input text-sm flex-1" value={opt}
                      onChange={e=>{const qs=[...c.questions];const opts=[...q.options];opts[oi]=e.target.value;qs[qi]={...q,options:opts};onChange({...c,questions:qs});}}/>
                  </div>
                ))}
              </div>
              <div><label className="label text-xs">İzahat</label>
                <input className="input text-sm" placeholder="Düzgün cavabın izahatı..." value={q.explanation??""} onChange={e=>{const qs=[...c.questions];qs[qi]={...q,explanation:e.target.value};onChange({...c,questions:qs});}}/></div>
            </div>
          ))}
          <button onClick={()=>onChange({...c,questions:[...(c.questions??[]),{id:`q-${Date.now()}`,text:"Yeni sual?",options:["Variant A","Variant B","Variant C","Variant D"],correctIndex:0,explanation:""}]})}
            className="btn-secondary btn-sm w-full"><Plus size={13}/> Sual əlavə et</button>
        </div>
      );

    case "TASK":
      return (
        <div className="space-y-3">
          <div><label className="label">Başlıq</label>
            <input className="input" value={block.title??""} onChange={e=>onChange(c,e.target.value)}/></div>
          <div><label className="label">Şərtlər</label>
            <textarea className="textarea h-20" value={c.instructions??""} onChange={e=>onChange({...c,instructions:e.target.value})}/></div>
          <div><label className="label">Placeholder</label>
            <input className="input" value={c.placeholder??""} onChange={e=>onChange({...c,placeholder:e.target.value})}/></div>
        </div>
      );

    case "DIVIDER":
      return <div className="text-sm text-muted text-center py-2">— Ayırıcı xətt —</div>;

    default:
      return <div className="text-sm text-muted">Redaktor yoxdur</div>;
  }
}

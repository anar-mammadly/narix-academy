"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CheckCircle2, NotebookPen, Pencil, Search, Trash2 } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatAzDateTime } from "../calendar/az-date";

export type NoteItem = {
  id: string;
  lessonId: string;
  content: string;
  updatedAt: string;
  lessonTitle: string;
  moduleTitle: string;
  slug: string | null;
};

const norm = (s: string) => s.toLocaleLowerCase("az");

export default function NotesClient({ initial, startSlug }: { initial: NoteItem[]; startSlug: string | null }) {
  const [notes, setNotes] = useState(initial);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<NoteItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return notes;
    return notes.filter((n) => norm(`${n.content} ${n.lessonTitle} ${n.moduleTitle}`).includes(q));
  }, [notes, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(toDelete.id)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error();
      setNotes((prev) => prev.filter((n) => n.id !== toDelete.id));
      toast({ variant: "success", title: "Qeyd silindi" });
      setToDelete(null);
    } catch {
      toast({ variant: "error", title: "Silinmədi", description: "Bir az sonra yenidən yoxla." });
    } finally {
      setDeleting(false);
    }
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={<NotebookPen className="h-6 w-6" aria-hidden />}
        title="Hələ qeydin yoxdur"
        description="Dərsi açıb “Qeydlər” panelində vacib fikirləri yaz — hamısı burada toplanacaq."
        action={
          startSlug ? (
            <Link href={`/learn/${startSlug}`} className={buttonStyles({ size: "sm" })}>
              Dərsə başla <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link href="/dashboard/lessons" className={buttonStyles({ size: "sm", variant: "secondary" })}>
              Öyrənmə yolu
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-5">
      <div className="relative">
        <label htmlFor="notes-search" className="sr-only">Qeydlərdə axtar</label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input
          id="notes-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Qeyd, dərs və ya modul axtar…"
          className="pl-10"
        />
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {query.trim() ? `${filtered.length} nəticə` : `${notes.length} qeyd`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" aria-hidden />} title="Heç nə tapılmadı" description="Başqa söz yoxla." />
      ) : (
        <ul className="grid gap-4">
          {filtered.map((n) => (
            <li key={n.id}>
              <NoteCard
                note={n}
                onChange={(patch) => setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, ...patch } : x)))}
                onDelete={() => setToDelete(n)}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={toDelete !== null}
        onOpenChange={(o) => !o && !deleting && setToDelete(null)}
        title="Qeyd silinsin?"
        description={toDelete ? `“${toDelete.lessonTitle}” dərsi üzrə qeyd birdəfəlik silinəcək.` : undefined}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>Ləğv et</Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleting}>
            {!deleting && <Trash2 className="h-4 w-4" aria-hidden />} Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function NoteCard({
  note, onChange, onDelete,
}: { note: NoteItem; onChange: (patch: Partial<NoteItem>) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [state, setState] = useState<SaveState>("idle");
  const lastSaved = useRef(note.content);
  const fieldId = useId();
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // Debounced autosave while editing.
  useEffect(() => {
    if (!editing || text === lastSaved.current) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: note.lessonId, content: text }),
        });
        if (!res.ok) throw new Error();
        const saved = (await res.json()) as { updatedAt: string };
        lastSaved.current = text;
        onChangeRef.current({ content: text, updatedAt: new Date(saved.updatedAt).toISOString() });
        setState("saved");
      } catch {
        setState("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [text, editing, note.lessonId]);

  return (
    <Card padding="sm" className="grid gap-3 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {note.moduleTitle && <p className="text-xs font-semibold uppercase tracking-wide text-iris">{note.moduleTitle}</p>}
          <h2 className="font-semibold text-ink">{note.lessonTitle}</h2>
          <p className="text-xs text-muted">Son dəyişiklik: {formatAzDateTime(note.updatedAt)}</p>
        </div>
        {note.slug && (
          <Link href={`/learn/${note.slug}`} className={buttonStyles({ variant: "soft", size: "sm" })}>
            Dərsə keç <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      {editing ? (
        <div className="grid gap-1.5">
          <label htmlFor={fieldId} className="sr-only">Qeydi redaktə et</label>
          <Textarea id={fieldId} rows={8} value={text} onChange={(e) => { setText(e.target.value); setState(e.target.value === lastSaved.current ? "saved" : "saving"); }} autoFocus maxLength={20000} />
          <p className="h-5 text-sm" aria-live="polite">
            {state === "saving" && <span className="text-muted">Yadda saxlanılır…</span>}
            {state === "saved" && (
              <span className="inline-flex items-center gap-1 text-pass"><CheckCircle2 className="h-4 w-4" aria-hidden /> Saxlanıldı</span>
            )}
            {state === "error" && <span className="text-bug">Saxlanılmadı. İnterneti yoxla.</span>}
          </p>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 text-sm leading-relaxed text-ink-2">{note.content}</p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="danger-ghost" size="sm" onClick={onDelete} aria-label={`“${note.lessonTitle}” qeydini sil`}>
          <Trash2 className="h-4 w-4" aria-hidden /> Sil
        </Button>
        {editing ? (
          <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={state === "saving"}>
            <Check className="h-4 w-4" aria-hidden /> Bitir
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => { setText(note.content); setState("idle"); setEditing(true); }}>
            <Pencil className="h-4 w-4" aria-hidden /> Redaktə et
          </Button>
        )}
      </div>
    </Card>
  );
}

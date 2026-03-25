"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function NewLessonPage() {
  const router = useRouter();
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((d) => {
        setModules(d.modules || []);
        if (d.modules?.[0]) setModuleId(d.modules[0].id);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleId) return;
    setLoading(true);
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        moduleId,
        slug: slug.trim() || undefined,
        shortDescription: shortDescription || undefined,
        published: false,
      }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/admin/lessons/${data.lesson.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href="/admin/lessons" className="text-sm text-blue-600 hover:underline">
        ← Dərslər
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Yeni dərs</h1>
      <p className="text-sm text-slate-600">Əsas məlumatları daxil edin; blokları növbəti addımda əlavə edəcəksiniz.</p>
      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Modul</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              required
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Başlıq</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Slug (istəyə bağlı)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="avtomatik yaradılacaq"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Qısa təsvir</Label>
            <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="mt-1" />
          </div>
          <Button type="submit" disabled={loading || !moduleId}>
            {loading ? "Yaradılır…" : "Davam et — blok redaktoru"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

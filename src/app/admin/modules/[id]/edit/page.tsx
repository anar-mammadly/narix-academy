"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card } from "@/frontend/components/ui/card";

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/modules");
      const data = await res.json();
      const m = data.modules?.find((x: { id: string }) => x.id === id);
      if (m) {
        setTitle(m.title);
        setDescription(m.description ?? "");
        setPublished(m.published);
      }
      setLoading(false);
    })();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || null, published }),
    });
    setSaving(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Modulu və içindəki bütün dərsləri silmək?")) return;
    await fetch(`/api/modules/${id}`, { method: "DELETE" });
    router.push("/admin/modules");
  }

  if (loading) return <p className="text-slate-500">Yüklənir…</p>;

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href="/admin/modules" className="text-sm text-blue-600 hover:underline">
        ← Modullar
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Modul redaktəsi</h1>
      <Card className="mt-6 p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Başlıq</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Təsvir</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Dərc et
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saxlanır…" : "Saxla"}
            </Button>
            <Button type="button" variant="danger" onClick={remove}>
              Sil
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

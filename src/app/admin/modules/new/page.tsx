"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card } from "@/frontend/components/ui/card";

export default function NewModulePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined, published }),
    });
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/admin/modules/${data.module.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href="/admin/modules" className="text-sm text-blue-600 hover:underline">
        ← Modullar
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Yeni modul</h1>
      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
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
          <Button type="submit" disabled={loading}>
            {loading ? "Yaradılır…" : "Yarat"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card } from "@/frontend/components/ui/card";

export default function NewStudentPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [generate, setGenerate] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        ...(generate ? { generatePassword: true } : { password }),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Xəta");
      return;
    }
    if (data.generatedPassword) setGenerated(data.generatedPassword);
    else setGenerated(null);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <Link href="/admin/students" className="text-sm text-blue-600 hover:underline">
        ← Tələbələr
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Yeni tələbə</h1>
      <Card className="mt-6 p-6">
        {generated ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">Tələbə yaradıldı.</p>
            <p className="mt-2">
              Müvəqqəti şifrə: <code className="rounded bg-white px-2 py-0.5 font-mono">{generated}</code>
            </p>
            <p className="mt-1 text-xs">Tələbəyə təhlükəsiz kanalla göndərin.</p>
          </div>
        ) : null}
        <form onSubmit={submit} className="space-y-4">
          {err ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div> : null}
          <div>
            <Label>Ad</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>E-poçt</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={generate} onChange={(e) => setGenerate(e.target.checked)} />
            Şifrəni avtomatik yarat
          </label>
          {!generate ? (
            <div>
              <Label>Şifrə (min. 8 simvol)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!generate}
                className="mt-1"
              />
            </div>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Yaradılır…" : "Yarat"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErr(data.error || "Giriş uğursuz");
      return;
    }
    const safe =
      data.role === "TEACHER"
        ? next.startsWith("/admin")
          ? next
          : "/admin"
        : next.startsWith("/dashboard")
          ? next
          : "/dashboard";
    router.push(safe);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-slate-200/90 p-8 shadow-lift animate-slide-up">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-soft">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">QA Academy</h1>
        <p className="mt-1 text-sm text-slate-600">Hesabınıza daxil olun</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
        ) : null}
        <div>
          <Label htmlFor="email">E-poçt</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Şifrə</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Giriş…" : "Daxil ol"}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-slate-500">
        Demo: müəllim <code className="rounded bg-slate-100 px-1">teacher@qaacademy.local</code> — tələbə{" "}
        <code className="rounded bg-slate-100 px-1">student@qaacademy.local</code>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50/80 p-4">
      <Suspense fallback={<div className="text-slate-500">Yüklənir…</div>}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-sm text-slate-500">
        <Link href="/" className="text-blue-600 hover:underline">
          Ana səhifə
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Flame, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/layout/Logo";

const RUN = [
  { name: "Software nədir?", state: "pass" },
  { name: "Testin 7 prinsipi", state: "pass" },
  { name: "Boundary Value Analysis", state: "pass" },
  { name: "Yaxşı Bug Report yazmaq", state: "pass" },
  { name: "API testing və Postman", state: "run" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Daxil olmaq alınmadı"); return; }
      router.push(data.role === "TEACHER" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("Serverə qoşulmaq alınmadı. İnterneti yoxla.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-semibold text-ink">Daxil ol</h1>
          <p className="mt-2 text-ink-2">QA öyrənməyə qaldığın yerdən davam et.</p>
          <form onSubmit={submit} className="mt-8 grid gap-4" noValidate>
            <Field label="Email">
              {(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="ad@narix.az" />}
            </Field>
            <Field label="Şifrə">
              {(p) => (
                <div className="relative">
                  <Input {...p} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="pr-12" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-ink" aria-label={show ? "Şifrəni gizlət" : "Şifrəni göstər"} aria-pressed={show}>
                    {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              )}
            </Field>
            {error && <p role="alert" className="rounded-lg bg-bug-soft px-3.5 py-2.5 text-sm text-bug">{error}</p>}
            <Button type="submit" size="lg" loading={loading} disabled={!email || !password} className="mt-2">Daxil ol</Button>
          </form>
          <p className="mt-6 text-sm text-muted">Hesabın yoxdur? Müəllimin səni platformaya əlavə edəcək.</p>
        </main>
      </div>

      {/* Showcase: one test run that passes, line by line */}
      <aside aria-hidden className="relative hidden overflow-clip bg-[#14123a] p-12 lg:flex lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#5b4bff] opacity-50 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-[#12c48b] opacity-25 blur-[120px]" />
        <div className="relative max-w-lg">
          <p className="font-display text-[2.6rem] font-semibold leading-[1.1] text-white">
            Bug tap.<br />Report yaz.<br />Testi keç.
          </p>
          <p className="mt-4 max-w-sm text-lg text-white/70">Manual QA-dan Playwright-a qədər — qısa dərslər, real tapşırıqlar.</p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 font-mono text-sm backdrop-blur">
            <p className="mb-3 text-white/50">$ narix run --kurs manual-qa</p>
            <ul className="grid gap-2">
              {RUN.map((t, i) => (
                <li key={t.name} className="flex items-center gap-3 text-white/90 animate-pop-in" style={{ animationDelay: `${300 + i * 380}ms` }}>
                  {t.state === "pass" ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#12c48b] text-[#06281c]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-[#2bb8ff]" />
                  )}
                  <span className={t.state === "run" ? "text-[#8fd3ff]" : undefined}>{t.name}</span>
                  <span className="ml-auto text-white/40">{t.state === "pass" ? "keçdi" : "davam edir"}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2 border-t border-white/10 pt-4 font-sans">
              <span className="flex items-center gap-1.5 rounded-full bg-[#ffb547]/15 px-3 py-1 text-sm font-semibold text-[#ffc566]"><Zap className="h-4 w-4 fill-current" /> 1 240 XP</span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#ff7a1a]/15 px-3 py-1 text-sm font-semibold text-[#ff9445]"><Flame className="h-4 w-4" /> 12 gün</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

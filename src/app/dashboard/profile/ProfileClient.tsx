"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

const GOALS = [
  { xp: 10, label: "Rahat", hint: "~5 dəq" },
  { xp: 30, label: "Normal", hint: "~15 dəq" },
  { xp: 50, label: "Ciddi", hint: "~25 dəq" },
  { xp: 80, label: "İntensiv", hint: "~40 dəq" },
];

export default function ProfileForm({ initial, email }: { initial: { name: string; bio: string; dailyGoalXp: number }; email: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Saxlanılmadı");
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Saxlanılmadı");
    }
  }

  return (
    <form onSubmit={save} className="grid gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <h2 className="font-display text-lg font-semibold text-ink">Tənzimləmələr</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ad və soyad" error={!form.name.trim() ? "Ad boş ola bilməz" : undefined}>
          {(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" maxLength={80} />}
        </Field>
        <Field label="Email" hint="Emaili müəllim dəyişə bilər.">
          {(p) => <Input {...p} value={email} disabled readOnly />}
        </Field>
      </div>
      <Field label="Haqqımda" hint="İstəyə görə, 200 simvola qədər.">
        {(p) => <Textarea {...p} rows={3} maxLength={200} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Məs: Manual QA öyrənirəm, hədəfim junior tester olmaqdır." />}
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-2">Gündəlik hədəf</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
          {GOALS.map((g) => {
            const active = form.dailyGoalXp === g.xp;
            return (
              <button
                type="button"
                key={g.xp}
                role="radio"
                aria-checked={active}
                onClick={() => setForm({ ...form, dailyGoalXp: g.xp })}
                className={cn("rounded-lg border-2 p-3 text-left transition-colors", active ? "border-iris bg-iris-soft" : "border-line hover:border-line-strong")}
              >
                <span className="block font-semibold text-ink">{g.label}</span>
                <span className="block text-sm text-muted">{g.xp} XP · {g.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {error && <p role="alert" className="text-sm text-bug">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={state === "saving"} disabled={!form.name.trim()}>Yadda saxla</Button>
        {state === "saved" && <span role="status" className="flex items-center gap-1.5 text-sm text-pass"><CheckCircle2 className="h-4 w-4" aria-hidden /> Saxlanıldı</span>}
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { BackLink } from "@/components/admin/BackLink";
import { errorMessage, requestJson } from "@/components/admin/request";

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join("");
}

type Errors = Partial<Record<"name" | "email" | "password", string>>;

export default function NewStudentPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): Errors {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "Ad ən az 2 simvol olmalıdır";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "E-poçt düzgün deyil";
    if (form.password.length < 8) e.password = "Şifrə ən az 8 simvol olmalıdır";
    return e;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    setServerError(null);
    try {
      await requestJson("/api/students", "POST", { name: form.name.trim(), email: form.email.trim(), password: form.password });
      toast({ title: "Tələbə əlavə edildi", description: "Giriş məlumatlarını tələbəyə təhlükəsiz kanalla göndərin.", variant: "success" });
      router.push("/admin/students");
      router.refresh();
    } catch (err) {
      setServerError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <BackLink href="/admin/students">Tələbələr</BackLink>
      <PageHeader title="Yeni tələbə" description="Hesab yaradın. Tələbə bu e-poçt və şifrə ilə daxil olacaq." />
      <Card>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Ad və soyad" error={errors.name}>
            {(p) => <Input {...p} autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Məs.: Aysel Məmmədova" />}
          </Field>
          <Field label="E-poçt" error={errors.email}>
            {(p) => <Input {...p} type="email" inputMode="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ad@example.com" />}
          </Field>
          <Field label="İlkin şifrə" error={errors.password} hint="Ən az 8 simvol. Tələbə daxil olduqdan sonra dəyişə bilər.">
            {(p) => (
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Input {...p} type={showPw ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-11 font-mono" />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Şifrəni gizlət" : "Şifrəni göstər"}
                    aria-pressed={showPw}
                    className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button variant="secondary" onClick={() => { setForm({ ...form, password: generatePassword() }); setShowPw(true); }}>
                  <RefreshCw className="h-4 w-4" aria-hidden /> Yarat
                </Button>
              </div>
            )}
          </Field>
          {serverError && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{serverError}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <Button variant="secondary" onClick={() => router.push("/admin/students")} disabled={loading}>Ləğv et</Button>
            <Button type="submit" loading={loading}>Tələbəni əlavə et</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

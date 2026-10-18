"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BackLink } from "@/components/admin/BackLink";
import { ModuleFields, emptyModule, moduleBody } from "@/components/admin/ModuleForm";
import { errorMessage, requestJson } from "@/components/admin/request";

export default function NewModulePage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(emptyModule);
  const [titleError, setTitleError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError("Başlıq tələb olunur");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const mod = await requestJson<{ id: string }>("/api/modules", "POST", moduleBody(form));
      toast({ title: "Modul yaradıldı", description: "İndi dərs əlavə edə bilərsiniz.", variant: "success" });
      router.push(`/admin/modules/${mod.id}/edit`);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <BackLink href="/admin/modules">Modullar</BackLink>
      <PageHeader title="Yeni modul" description="Modul bir mövzu ətrafında birləşən dərslər qrupudur." />
      <Card>
        <form onSubmit={submit} noValidate className="space-y-6">
          <ModuleFields value={form} onChange={(d) => { setForm(d); setTitleError(undefined); }} titleError={titleError} />
          {error && <p role="alert" className="rounded-lg bg-bug-soft p-3 text-sm text-bug">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row">
            <Button variant="secondary" onClick={() => router.push("/admin/modules")} disabled={loading}>Ləğv et</Button>
            <Button type="submit" loading={loading}>Modul yarat</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

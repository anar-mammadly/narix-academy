"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { errorMessage, requestJson } from "./request";
import type { CurriculumPlan } from "@/lib/curriculum-sync";

/**
 * Shown on the modules page when the platform ships lessons that are not in
 * the database yet (after an update). One button adds them; lessons that
 * already exist keep their text.
 */
export function CurriculumSync({ plan }: { plan: CurriculumPlan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const pending = plan.newLessons.length + plan.newModules.length + plan.moved;
  if (pending === 0 && !message) return null;

  async function apply() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await requestJson<{ created: number }>("/api/curriculum/sync", "POST");
      setMessage({ kind: "ok", text: `${res.created} yeni dərs əlavə olundu.` });
      router.refresh();
    } catch (e) {
      setMessage({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Yeni dərslər" className="mb-6 rounded-2xl border border-iris/30 bg-iris-soft/50 p-4 sm:p-5">
      {pending > 0 && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-ink">Platformada {plan.newLessons.length} yeni dərs var</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-2">
              {plan.newModules.length > 0 && <>Yeni modullar: {plan.newModules.join(", ")}. </>}
              Mövcud dərslərin mətninə toxunulmur; yalnız yeni dərslər əlavə olunur və dərslər öz modullarına düzülür.
            </p>
            {plan.errors.length > 0 && <p className="mt-2 text-sm font-medium text-bug">{plan.errors[0]}</p>}
          </div>
          <Button onClick={apply} loading={busy} disabled={plan.errors.length > 0}>
            <DownloadCloud className="h-4 w-4" aria-hidden /> Yeni dərsləri əlavə et
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className={message.kind === "ok" ? "text-sm font-medium text-pass" : "mt-3 text-sm font-medium text-bug"}>{message.text}</p>
      )}
    </section>
  );
}

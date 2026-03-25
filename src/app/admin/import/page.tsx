"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import { Card } from "@/frontend/components/ui/card";

type ModuleOpt = { id: string; title: string };

type PreviewResponse = {
  preview?: {
    module: { id: string; title: string };
    lesson: {
      title: string;
      slug: string;
      shortDescription: string | null;
      estimatedMinutes: number;
      published: boolean;
      quizEnabled: boolean;
      minQuizScore: number | null;
    };
    blocks: Array<{
      type: string;
      title: string | null;
      order: number;
      imageUrl: string | null;
      content: unknown;
    }>;
    totals: { blockCount: number };
  };
  lesson?: { id: string };
  importedBlocks?: number;
  error?: string;
};

export default function AdminJsonImportPage() {
  const [modules, setModules] = useState<ModuleOpt[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [titleOverride, setTitleOverride] = useState("");
  const [jsonText, setJsonText] = useState(`{
  "lesson": {
    "title": "System Testing",
    "shortDescription": "System Testing və əsas növləri",
    "estimatedMinutes": 15
  },
  "blocks": [
    {
      "type": "TEXT",
      "title": "📌 System Testing",
      "content": {
        "body": "System Testing — bütün sistemin tam şəkildə test edilməsidir.\\n👉 Yəni bütün modullar birlikdə yoxlanılır (end-to-end).",
        "highlight": "warning"
      }
    }
  ]
}`);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse["preview"] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/modules");
      const data = await res.json();
      const mods: ModuleOpt[] = data.modules || [];
      setModules(mods);
      if (mods[0]) setModuleId(mods[0].id);
    })();
  }, []);

  const canSubmit = useMemo(() => moduleId && jsonText.trim().length > 0, [moduleId, jsonText]);

  async function callImport(mode: "dryRun" | "commit", actionLabel: string) {
    setMessage(null);
    setLoading(true);
    try {
      let payload: unknown;
      try {
        payload = JSON.parse(jsonText);
      } catch {
        setMessage("JSON parse edilə bilmədi. Formatı yoxlayın.");
        return;
      }

      const qs = new URLSearchParams({
        mode,
        moduleId,
      });
      const override = titleOverride.trim();
      if (override) {
        qs.set("lessonTitleOverride", override);
      }

      const res = await fetch(`/api/lessons/import?${qs.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setMessage(data.error || "Xəta baş verdi");
        return;
      }
      if (mode === "dryRun") {
        setPreview(data.preview ?? null);
        setMessage(`${actionLabel} uğurludur.`);
      } else {
        setPreview(null);
        setMessage(`Import tamamlandı. ${data.importedBlocks ?? 0} blok əlavə olundu.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
      <div>
        <Link href="/admin/lessons" className="text-sm text-blue-600 hover:underline">
          ← Dərslər
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Import from JSON</h1>
        <p className="text-sm text-slate-600">
          JSON məzmununu yoxlayın, önizləyin və seçilmiş modul daxilinə dərs kimi import edin.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Modul seçin</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Dərs başlığı (override, istəyə bağlı)</Label>
            <Input
              className="mt-1"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              placeholder="Boş buraxsanız JSON lesson.title istifadə olunur"
            />
          </div>
          <div className="md:col-span-2">
            <Label>JSON input</Label>
            <Textarea
              className="mt-1 min-h-[340px] font-mono text-xs"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!canSubmit || loading} onClick={() => callImport("dryRun", "Validate JSON")}>
            Validate JSON
          </Button>
          <Button variant="outline" disabled={!canSubmit || loading} onClick={() => callImport("dryRun", "Preview")}>
            Preview
          </Button>
          <Button variant="primary" disabled={!canSubmit || loading} onClick={() => callImport("commit", "Import")}>
            Import
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </Card>

      {preview ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
          <p className="mt-1 text-sm text-slate-600">
            Modul: <span className="font-medium">{preview.module.title}</span>
          </p>
          <p className="text-sm text-slate-600">
            Dərs: <span className="font-medium">{preview.lesson.title}</span> ({preview.lesson.slug})
          </p>
          <p className="text-sm text-slate-600">Blok sayı: {preview.totals.blockCount}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Title</th>
                </tr>
              </thead>
              <tbody>
                {preview.blocks.map((b) => (
                  <tr key={`${b.order}-${b.type}-${b.title ?? ""}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{b.order}</td>
                    <td className="px-3 py-2">{b.type}</td>
                    <td className="px-3 py-2">{b.title ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

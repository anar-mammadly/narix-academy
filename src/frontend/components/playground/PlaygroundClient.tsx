"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Bug,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Globe,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Spinner } from "@/frontend/components/ui/spinner";
import { cn } from "@/frontend/lib/cn";

const DEMO_TEST_CASES = [
  { id: "TC-01", title: "Login — düzgün məlumat", expected: "İstifadəçi panelə yönləndirilir", priority: "P1" },
  { id: "TC-02", title: "Login — səhv şifrə", expected: "Xəta mesajı göstərilir, sessiya yaranmır", priority: "P1" },
  { id: "TC-03", title: "Forma — boş məcburi sahələr", expected: "Validasiya işləyir, submit dayanır", priority: "P2" },
  { id: "TC-04", title: "Mobil — nav menyusu", expected: "Menyu açılır/bağlanır, keçid işləyir", priority: "P2" },
];

const DEMO_BUG_NOTES = [
  {
    id: "1",
    title: "Qeyd: şəkil yükləmə zamanı spinner itir",
    severity: "Major",
    env: "Chrome 120 / macOS",
  },
  {
    id: "2",
    title: "UI: düymə hover-da kontrast aşağıdır",
    severity: "Minor",
    env: "Safari 17",
  },
  {
    id: "3",
    title: "API: 500 cavabında istifadəçiyə ümumi mesaj",
    severity: "Triage",
    env: "Production",
  },
];

const DEMO_CHECKLIST = [
  { id: "c1", label: "Smoke: əsas səhifə açılır", done: true },
  { id: "c2", label: "Regression: əvvəlki bug ticket-ləri yoxlanıldı", done: true },
  { id: "c3", label: "Cross-browser: Chrome + Safari", done: false },
  { id: "c4", label: "Responsive: 375px və 1280px", done: false },
  { id: "c5", label: "Accessibility: fokus və klaviatura", done: false },
];

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function PlaygroundClient() {
  const [urlInput, setUrlInput] = useState("https://example.com");
  const [iframeSrc, setIframeSrc] = useState("https://example.com");
  const [iframeNonce, setIframeNonce] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const severityStyles = useMemo(
    () =>
      ({
        Major: "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80",
        Minor: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
        Triage: "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80",
      }) as const,
    []
  );

  const openPreview = useCallback(() => {
    setUrlError(null);
    if (!isValidHttpUrl(urlInput)) {
      setUrlError("Düzgün http və ya https ünvanı daxil edin.");
      return;
    }
    setIframeLoading(true);
    setIframeNonce((n) => n + 1);
    setIframeSrc(urlInput.trim());
  }, [urlInput]);

  return (
    <div className="animate-fade-in space-y-10 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/60 p-8 shadow-lift md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
              <Sparkles className="h-4 w-4" />
              QA Playground
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Təcrübə və manual test aləti
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
              Burada nümunə test ssenariləri, bug qeydləri və veb-səhifə önizləməsi ilə praktika edə bilərsiniz.
              Bəzi saytlar iframe-də açılmağa icazə verməyə bilər — bu, həmin saytın təhlükəsizlik siyasətidir.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="group border-slate-200/80 p-0 transition-all duration-300 hover:border-indigo-200/60 hover:shadow-lift">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-5 w-5 text-indigo-600 transition-transform duration-300 group-hover:scale-110" />
              Test cases
            </CardTitle>
            <p className="text-sm font-normal text-slate-500">Nümunə demo ssenarilər (mock)</p>
          </CardHeader>
          <div className="divide-y divide-slate-100 p-2">
            {DEMO_TEST_CASES.map((row, i) => (
              <div
                key={row.id}
                className="animate-slide-up rounded-xl px-4 py-3 transition-colors hover:bg-slate-50/80"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-mono font-medium text-white">
                    {row.id}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      row.priority === "P1" ? "bg-red-50 text-red-800 ring-1 ring-red-100" : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {row.priority}
                  </span>
                </div>
                <p className="mt-2 font-medium text-slate-900">{row.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="text-slate-400">Gözlənti: </span>
                  {row.expected}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="group border-slate-200/80 p-0 transition-all duration-300 hover:border-indigo-200/60 hover:shadow-lift">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bug className="h-5 w-5 text-amber-600 transition-transform duration-300 group-hover:scale-110" />
              Bug report notes
            </CardTitle>
            <p className="text-sm font-normal text-slate-500">Qısa qeyd formatı (mock)</p>
          </CardHeader>
          <ul className="space-y-3 p-4">
            {DEMO_BUG_NOTES.map((note, i) => (
              <li
                key={note.id}
                className="animate-slide-up rounded-2xl border border-slate-100 bg-white p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      severityStyles[note.severity as keyof typeof severityStyles]
                    )}
                  >
                    {note.severity}
                  </span>
                  <span className="text-xs text-slate-400">{note.env}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">{note.title}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="border-slate-200/80 p-0 transition-all duration-300 hover:shadow-lift">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ListChecks className="h-5 w-5 text-emerald-600" />
            Manual testing checklist
          </CardTitle>
          <p className="text-sm font-normal text-slate-500">Nümunə siyahı — yalnız UI (mock)</p>
        </CardHeader>
        <ul className="grid gap-2 p-4 sm:grid-cols-2">
          {DEMO_CHECKLIST.map((item, i) => (
            <li
              key={item.id}
              className="animate-slide-up flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-soft transition-all hover:border-emerald-200/60"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" aria-hidden />
              )}
              <span className={cn("text-sm", item.done ? "text-slate-700" : "text-slate-500")}>{item.label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden border-slate-200/80 p-0 shadow-lift">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-5 w-5 text-indigo-600" />
            Website preview tool
          </CardTitle>
          <p className="text-sm font-normal text-slate-500">
            URL daxil edin və &quot;Open&quot; ilə iframe önizləməsində açın.
          </p>
        </CardHeader>
        <div className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="preview-url">Səhifə ünvanı</Label>
              <Input
                id="preview-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={openPreview}
              disabled={iframeLoading}
              className="shrink-0 gap-2 shadow-md transition-all hover:shadow-lg"
            >
              {iframeLoading ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : null}
              Open
              <ExternalLink className="h-4 w-4 opacity-80" />
            </Button>
          </div>
          {urlError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 animate-fade-in">
              {urlError}
            </div>
          ) : null}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
            {iframeLoading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm animate-fade-in">
                <Spinner className="h-8 w-8 border-indigo-600 border-t-transparent" />
                <p className="text-sm font-medium text-slate-600">Önizləmə yüklənir…</p>
              </div>
            ) : null}
            <iframe
              key={`${iframeSrc}-${iframeNonce}`}
              title="Website preview"
              src={iframeSrc}
              className="h-[min(70vh,560px)] w-full bg-white transition-opacity duration-300"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setIframeLoading(false)}
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Qeyd: Bəzi saytlar (məs. bank, sosial şəbəkələr) iframe-də göstərilməyə icazə vermir. Bu halda boş və ya xəta
            səhifəsi görünə bilər — bu normaldır.
          </p>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { ImageUp, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/admin/Switch";
import { errorMessage, requestJson } from "@/components/admin/request";
import type { Appearance } from "@/lib/site-settings";

type ToggleKey = Exclude<keyof Appearance, "loginImageUrl">;

const GROUPS: { title: string; note: string; items: { key: ToggleKey; label: string; hint: string }[] }[] = [
  {
    title: "Tələbə tərəfi",
    note: "Tələbənin gördüyü səhifələr.",
    items: [
      { key: "dashboardCharts", label: "Ana səhifədə qrafiklər", hint: "Son 14 günün XP qrafiki və modullar üzrə irəliləyiş." },
      { key: "moduleArt", label: "Modul üzlükləri", hint: "Öyrənmə yolunda hər modulun rəngli illüstrasiyası." },
      { key: "lessonVisuals", label: "Dərslərdə şəkil, diaqram və qrafiklər", hint: "Söndürüləndə dərslər yalnız mətn, kod və tapşırıqlarla göstərilir. Bloklar silinmir." },
    ],
  },
  {
    title: "Giriş səhifəsi və müəllim paneli",
    note: "Giriş ekranı və bu panelin ümumi baxışı.",
    items: [
      { key: "loginArt", label: "Giriş səhifəsində illüstrasiya", hint: "Sağ tərəfdəki rəngli panel. Söndürüləndə yalnız giriş forması qalır." },
      { key: "adminCharts", label: "Ümumi baxışda qrafiklər", hint: "Tələbə aktivliyi və modulların tamamlanma qrafikləri." },
    ],
  },
];

export function AppearanceClient({ initial }: { initial: Appearance }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<{ kind: "idle" | "saved" | "error"; text?: string }>({ kind: "idle" });
  const [url, setUrl] = useState(initial.loginImageUrl);
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  // every change is saved at once; a failed save puts the switch back
  async function save(patch: Partial<Appearance>) {
    const before = value;
    setValue({ ...value, ...patch });
    try {
      setValue(await requestJson<Appearance>("/api/settings/appearance", "PUT", patch));
      setStatus({ kind: "saved", text: "Saxlanıldı" });
    } catch (e) {
      setValue(before);
      setStatus({ kind: "error", text: errorMessage(e) });
    }
  }

  async function upload(f: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/upload/image", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Şəkil yüklənmədi");
      setUrl(json.url);
      await save({ loginImageUrl: json.url });
    } catch (e) {
      setStatus({ kind: "error", text: errorMessage(e) });
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div className="grid gap-6">
      {GROUPS.map((g) => (
        <Card key={g.title}>
          <CardHeader>
            <CardTitle>{g.title}</CardTitle>
            <p className="text-sm text-muted">{g.note}</p>
          </CardHeader>
          <div className="grid divide-y divide-line">
            {g.items.map((item) => (
              <Switch
                key={item.key}
                className="py-3.5 first:pt-0 last:pb-0"
                checked={value[item.key]}
                onCheckedChange={(checked) => save({ [item.key]: checked })}
                label={item.label}
                hint={item.hint}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Giriş səhifəsinin şəkli</CardTitle>
          <p className="text-sm text-muted">Boş saxlasanız, platformanın öz illüstrasiyası göstərilir. Öz şəklinizi yükləyə və ya https keçidi verə bilərsiniz.</p>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Şəklin keçidi
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </label>
          <Button variant="secondary" onClick={() => save({ loginImageUrl: url.trim() })} disabled={url.trim() === value.loginImageUrl}>Keçidi saxla</Button>
          <Button variant="secondary" loading={uploading} onClick={() => file.current?.click()}>
            <ImageUp className="h-4 w-4" aria-hidden /> Şəkil yüklə
          </Button>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
        {value.loginImageUrl && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.loginImageUrl} alt="Giriş səhifəsinin cari şəkli" className="h-28 w-44 rounded-xl border border-line object-cover" />
            <Button variant="ghost" onClick={() => { setUrl(""); save({ loginImageUrl: "" }); }}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Standart illüstrasiyaya qayıt
            </Button>
          </div>
        )}
      </Card>

      <p role="status" aria-live="polite" className={status.kind === "error" ? "text-sm font-medium text-bug" : "text-sm text-muted"}>
        {status.text ?? "Hər dəyişiklik avtomatik saxlanılır."}
      </p>
    </div>
  );
}

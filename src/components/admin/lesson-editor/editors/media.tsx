"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { ImageContent, VideoContent } from "@/types/blocks";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { VideoBlockEditor } from "../../VideoBlockEditor";
import { RequestError, errorMessage } from "../../request";
import type { EditorProps } from "../types";
import { Segmented, TextField } from "./fields";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  let res: Response;
  try {
    res = await fetch("/api/upload/image", { method: "POST", body: fd });
  } catch {
    throw new RequestError("Şəbəkə xətası", 0, null);
  }
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) throw new RequestError(data?.error ?? "Şəkil yüklənmədi", res.status, data);
  return data.url;
}

export function ImageEditor({ value, onChange }: EditorProps<ImageContent>) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function pick(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange({ ...value, url });
    } catch (e) {
      toast({ title: "Şəkil yüklənmədi", description: errorMessage(e), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {value.url ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={value.alt || ""} className="max-h-72 w-full rounded-lg border border-line bg-surface-2 object-contain" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" aria-hidden /> Əvəz et
            </Button>
            <Button variant="danger-ghost" size="sm" onClick={() => onChange({ ...value, url: "" })}>
              <X className="h-4 w-4" aria-hidden /> Şəkli sil
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong p-6 text-center transition-colors hover:border-iris/60 hover:bg-surface-2/60"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden /> : <ImagePlus className="h-6 w-6 text-muted" aria-hidden />}
          <span className="text-sm font-medium text-ink-2">{uploading ? "Yüklənir…" : "Şəkil yükləmək üçün klikləyin"}</span>
          <span className="text-xs text-muted">PNG, JPG, WebP — maks. 10MB</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = "";
        }}
      />
      <TextField label="Və ya şəkil URL-i" value={value.url} onChange={(url) => onChange({ ...value, url })} placeholder="https://…" />
      <TextField
        label="Alternativ mətn (alt)"
        value={value.alt}
        onChange={(alt) => onChange({ ...value, alt })}
        hint="Şəkli görməyən istifadəçi üçün qısa təsvir. Yalnız bəzək üçündürsə, boş saxlayın."
        placeholder="Məs.: Giriş formasında xəta mesajı"
      />
      <TextField label="Alt yazı (istəyə bağlı)" value={value.caption} onChange={(caption) => onChange({ ...value, caption })} />
      <Segmented
        label="Düzləndirmə"
        value={value.alignment ?? "center"}
        onChange={(alignment) => onChange({ ...value, alignment })}
        options={[
          { value: "left", label: "Sol" },
          { value: "center", label: "Mərkəz" },
          { value: "right", label: "Sağ" },
        ]}
      />
    </div>
  );
}

export function VideoEditor({ value, onChange }: EditorProps<VideoContent>) {
  return (
    <div className="space-y-4">
      <VideoBlockEditor content={value} onChange={onChange} />
      <TextField label="Alt yazı (istəyə bağlı)" value={value.caption} onChange={(caption) => onChange({ ...value, caption })} />
    </div>
  );
}

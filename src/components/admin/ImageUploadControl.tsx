"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isRemoteImageSrc } from "@/lib/remote-image";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function ImageUploadControl({ value, onChange, label = "Şəkil yüklə" }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setErr(null);
              const local = URL.createObjectURL(f);
              setPreview(local);
              setBusy(true);
              try {
                const fd = new FormData();
                fd.append("file", f);
                const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Yükləmə uğursuz");
                onChange(data.url);
              } catch (er) {
                setErr(er instanceof Error ? er.message : "Xəta");
                setPreview(null);
              } finally {
                setBusy(false);
              }
            }}
          />
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50",
              busy && "pointer-events-none opacity-60"
            )}
          >
            <Upload className="h-4 w-4" />
            {busy ? "Emal…" : label}
          </span>
        </label>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Şəkli sil
          </Button>
        ) : null}
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {(preview || value) && (
        <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <Image
            src={value || preview || ""}
            alt="Önizləmə"
            fill
            className="object-contain"
            unoptimized={Boolean(preview) || isRemoteImageSrc(value)}
          />
        </div>
      )}
    </div>
  );
}

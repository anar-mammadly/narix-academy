"use client";

import { useId, useRef, useState } from "react";
import { UploadCloud, X, Link2, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import type { VideoContent } from "@/types/blocks";
import { errorMessage, requestJson } from "./request";

const ACCEPTED = ".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime";

interface VideoBlockEditorProps {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
}

/** Video source picker: direct upload to R2 via a presigned URL, or an external link. */
export function VideoBlockEditor({ content: c, onChange }: VideoBlockEditorProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkId = useId();
  const toast = useToast();

  async function uploadFile(file: File) {
    setUploading(true);
    setProgress(0);
    try {
      const { uploadUrl, publicUrl } = await requestJson<{ uploadUrl: string; publicUrl: string }>("/api/upload/presign", "POST", {
        contentType: file.type,
        size: file.size,
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Fayl yüklənmədi")));
        xhr.onerror = () => reject(new Error("Fayl yüklənmədi"));
        xhr.send(file);
      });

      onChange({ ...c, url: publicUrl, source: "upload" });
      toast({ title: "Video yükləndi", variant: "success" });
    } catch (e) {
      toast({ title: "Video yüklənmədi", description: errorMessage(e), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  const hasUploadedVideo = c.source === "upload" && !!c.url;

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-ink-2">Video faylı</span>

      {uploading ? (
        <div className="space-y-2 rounded-lg border border-line bg-surface-2/60 p-4" aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yüklənir… {progress}%
          </div>
          <ProgressBar value={progress} label="Video yüklənməsi" />
        </div>
      ) : hasUploadedVideo ? (
        <div className="space-y-2">
          <video src={c.url} controls className="max-h-64 w-full rounded-lg bg-black" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Əvəz et
            </Button>
            <Button variant="danger-ghost" size="sm" onClick={() => onChange({ ...c, url: "", source: "external" })}>
              <X className="h-4 w-4" aria-hidden /> Sil
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-iris bg-iris-soft" : "border-line-strong hover:border-iris/60 hover:bg-surface-2/60"
          )}
        >
          <UploadCloud className="h-6 w-6 text-muted" aria-hidden />
          <span className="text-sm font-medium text-ink-2">Videonu bura atın və ya seçmək üçün klikləyin</span>
          <span className="text-xs text-muted">MP4, WebM, MOV</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = "";
        }}
      />

      <div>
        <Label htmlFor={linkId} className="flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" aria-hidden /> Və ya xarici keçid (YouTube, Loom, Vimeo)
        </Label>
        <Input
          id={linkId}
          type="url"
          inputMode="url"
          placeholder="https://youtube.com/watch?v=…"
          value={c.source === "external" ? c.url ?? "" : ""}
          onChange={(e) => onChange({ ...c, url: e.target.value, source: "external" })}
        />
      </div>
    </div>
  );
}

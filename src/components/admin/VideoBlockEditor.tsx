"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import type { VideoContent } from "@/types/blocks";

const ACCEPTED = ".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime";

interface VideoBlockEditorProps {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
}

export function VideoBlockEditor({ content: c, onChange }: VideoBlockEditorProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function uploadFile(file: File) {
    setUploading(true);
    setProgress(0);
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const { error } = await presignRes.json();
        throw new Error(error ?? "Presign xətası");
      }
      const { uploadUrl, publicUrl } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Yükləmə xətası")));
        xhr.onerror = () => reject(new Error("Yükləmə xətası"));
        xhr.send(file);
      });

      onChange({ ...c, url: publicUrl, source: "upload" });
      toast({ title: "Video yükləndi", variant: "success" });
    } catch (e: any) {
      toast({ title: "Video yüklənmədi", description: e.message, variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  const hasUploadedVideo = c.source === "upload" && c.url;

  return (
    <div className="space-y-3">
      <label className="label">Video</label>

      {uploading ? (
        <div className="rounded-xl border border-gray-200 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Yüklənir... {progress}%
          </div>
          <ProgressBar value={progress} />
        </div>
      ) : hasUploadedVideo ? (
        <div className="space-y-2">
          <video src={c.url} controls className="w-full max-h-56 rounded-xl bg-black" />
          <div className="flex gap-2">
            <button onClick={() => inputRef.current?.click()} className="btn-secondary btn-sm">
              Əvəz et
            </button>
            <button
              onClick={() => onChange({ ...c, url: "", source: "external" })}
              className="btn-ghost btn-sm text-danger hover:bg-danger/10"
            >
              <X size={14} /> Sil
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            dragOver ? "border-primary bg-primary-light" : "border-gray-200 hover:border-gray-300"
          )}
        >
          <UploadCloud className="h-6 w-6 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">Video sürüşdür və burax, ya da klikləyib seç</p>
          <p className="text-xs text-muted">MP4, WebM, MOV — maks. 500MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-2 text-xs text-muted">
        <Link2 size={13} /> Və ya xarici keçid (YouTube/Loom) əlavə et:
      </div>
      <input
        className="input text-sm"
        placeholder="https://youtube.com/watch?v=..."
        value={c.source === "external" ? c.url ?? "" : ""}
        onChange={(e) => onChange({ ...c, url: e.target.value, source: "external" })}
      />
    </div>
  );
}

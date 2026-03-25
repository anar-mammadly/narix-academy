"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { isRemoteImageSrc } from "@/lib/remote-image";
import { Modal } from "@/components/ui/modal";

type UniformImageProps = {
  src: string;
  alt: string;
  caption?: string | null;
  alignment?: "left" | "center" | "right";
  className?: string;
};

export function UniformImage({ src, alt, caption, alignment = "center", className }: UniformImageProps) {
  const [lightbox, setLightbox] = useState(false);
  if (!src) return null;

  const remote = isRemoteImageSrc(src);

  const align =
    alignment === "left"
      ? "mr-auto"
      : alignment === "right"
        ? "ml-auto"
        : "mx-auto";

  return (
    <>
      <figure className={cn("my-6 max-w-3xl", align, className)}>
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="group block w-full overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="relative aspect-[16/9] w-full max-h-[420px] bg-slate-100">
            <Image
              src={src}
              alt={alt || "Dərs şəkli"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
              unoptimized={remote}
            />
          </div>
        </button>
        {caption ? (
          <figcaption className="mt-2 text-center text-sm text-slate-600">{caption}</figcaption>
        ) : null}
      </figure>
      <Modal open={lightbox} onClose={() => setLightbox(false)} title={caption || "Şəkil önizləmə"}>
        <div className="relative aspect-video w-full bg-slate-100">
          <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" unoptimized={remote} />
        </div>
      </Modal>
    </>
  );
}

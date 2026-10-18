"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** Replacement for window.confirm with an accessible dialog. */
export function ConfirmModal({
  open, onOpenChange, title, description, children, confirmLabel = "Təsdiqlə", cancelLabel = "Ləğv et",
  tone = "danger", loading, onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(o) => !loading && onOpenChange(o)} title={title} description={description}>
      {children && (
        <div className={cn("mb-5 flex gap-3 rounded-lg p-3.5 text-sm text-ink-2", tone === "danger" ? "bg-bug-soft/60" : "bg-surface-2")}>
          {tone === "danger" && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bug" aria-hidden />}
          <div className="min-w-0">{children}</div>
        </div>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>{cancelLabel}</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

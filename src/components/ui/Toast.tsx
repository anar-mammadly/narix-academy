"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info" | "xp";

interface ToastMessage { id: number; title: string; description?: string; variant: ToastVariant }
interface ToastContextValue { toast: (msg: Omit<ToastMessage, "id">) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

const variantIcon: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-pass" />,
  error: <XCircle className="h-5 w-5 text-bug" />,
  warning: <AlertTriangle className="h-5 w-5 text-xp" />,
  info: <Info className="h-5 w-5 text-sky" />,
  xp: <Zap className="h-5 w-5 fill-xp-bright text-xp-bright" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }, []);
  const remove = useCallback((id: number) => setMessages((prev) => prev.filter((m) => m.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="down" duration={3500} label="Bildiriş">
        {children}
        {messages.map((m) => (
          <RadixToast.Root
            key={m.id}
            onOpenChange={(open) => !open && remove(m.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 pr-3 shadow-lift animate-pop-in",
              m.variant === "xp" && "border-xp-bright/40 bg-xp-soft"
            )}
          >
            <span className="mt-0.5 shrink-0">{variantIcon[m.variant]}</span>
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="text-sm font-semibold text-ink">{m.title}</RadixToast.Title>
              {m.description && <RadixToast.Description className="mt-0.5 text-sm text-muted">{m.description}</RadixToast.Description>}
            </div>
            <RadixToast.Close className="rounded p-1 text-muted hover:text-ink" aria-label="Bağla"><X className="h-4 w-4" /></RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed inset-x-3 bottom-24 z-[100] mx-auto flex max-w-sm flex-col gap-2 outline-none lg:inset-x-auto lg:bottom-6 lg:right-6" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantIcon: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-info" />,
};

const variantBorder: Record<ToastVariant, string> = {
  success: "border-l-success",
  error: "border-l-danger",
  warning: "border-l-warning",
  info: "border-l-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }, []);

  const remove = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {children}
        {messages.map((m) => (
          <RadixToast.Root
            key={m.id}
            onOpenChange={(open) => !open && remove(m.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border-l-4 bg-white p-4 shadow-lg data-[state=open]:animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[fadeIn_0.2s_ease-out_reverse] data-[swipe=end]:animate-[slideInRight_0.2s_ease-out_reverse]",
              variantBorder[m.variant]
            )}
          >
            {variantIcon[m.variant]}
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="text-sm font-semibold text-gray-900">{m.title}</RadixToast.Title>
              {m.description && (
                <RadixToast.Description className="mt-0.5 text-xs text-muted">
                  {m.description}
                </RadixToast.Description>
              )}
            </div>
            <RadixToast.Close className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/frontend/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300/90 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

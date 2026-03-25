import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md focus-visible:outline-blue-600 active:scale-[0.98]",
          variant === "secondary" &&
            "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
          variant === "outline" &&
            "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
          variant === "ghost" && "text-slate-700 hover:bg-slate-100",
          variant === "danger" && "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
          size === "sm" && "h-8 px-3 text-sm",
          size === "md" && "h-10 px-4 text-sm",
          size === "lg" && "h-11 px-6 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

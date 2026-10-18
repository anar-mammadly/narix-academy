import type { ButtonHTMLAttributes, Ref } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-iris text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:bg-iris-strong",
        secondary:
          "border border-line bg-surface text-ink shadow-[inset_0_-2px_0_var(--c-line)] hover:bg-surface-2",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
        soft: "bg-iris-soft text-iris-ink hover:bg-iris/15",
        success:
          "bg-pass-bright text-[#06281c] shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)] hover:brightness-105",
        danger: "bg-bug text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)] hover:brightness-110",
        "danger-ghost": "text-bug hover:bg-bug-soft",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-lg px-4 text-[0.95rem]",
        lg: "h-13 rounded-xl px-6 text-base",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ variant, size, block, loading, disabled, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

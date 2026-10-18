import { useId, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const fieldStyles =
  "w-full rounded-lg border border-line bg-surface px-3.5 text-base text-ink placeholder:text-muted/80 transition-[border-color,box-shadow] outline-none hover:border-line-strong focus:border-iris focus:ring-4 focus:ring-iris/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-bug aria-[invalid=true]:ring-bug/15";

export function Input({ className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(fieldStyles, "h-11", className)} {...props} />;
}

export function Textarea({ className, ref, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea ref={ref} className={cn(fieldStyles, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink-2", className)} {...props} />;
}

/** Label + control + hint/error wired together with ids. */
export function Field({
  label, hint, error, children, className,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-bug">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

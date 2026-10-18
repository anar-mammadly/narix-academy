import { getInitials, cn } from "@/lib/utils";

const sizeClass = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg", xl: "h-20 w-20 text-2xl" };

// Stable per-person colour so lists are easy to scan.
const palettes = [
  "bg-iris-soft text-iris-ink", "bg-pass-soft text-pass", "bg-sky-soft text-sky",
  "bg-xp-soft text-xp", "bg-flame-soft text-flame", "bg-bug-soft text-bug",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, src, size = "md", className }: { name: string; src?: string | null; size?: keyof typeof sizeClass; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", sizeClass[size], className)} />;
  }
  return (
    <div aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full font-display font-semibold", palettes[hash(name) % palettes.length], sizeClass[size], className)}>
      {getInitials(name)}
    </div>
  );
}

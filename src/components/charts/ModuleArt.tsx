// A quiet decorative cover for a module, drawn from its colour: rings, a dotted
// grid and a rising line. Purely decorative (aria-hidden); the teacher can
// switch all of them off under Admin → Görünüş.
export function ModuleArt({ color, index = 0, className }: { color: string; index?: number; className?: string }) {
  const flip = index % 2 === 1;
  return (
    <svg viewBox="0 0 220 120" aria-hidden className={className} style={{ color, transform: flip ? "scaleX(-1)" : undefined }}>
      <g fill="none" stroke="currentColor">
        <circle cx="170" cy="34" r="46" strokeWidth="1.5" opacity="0.22" />
        <circle cx="170" cy="34" r="30" strokeWidth="1.5" opacity="0.34" />
        <circle cx="170" cy="34" r="14" strokeWidth="1.5" opacity="0.5" />
        <path d="M18 104c24-6 34-30 58-34s30 14 52 6 30-34 60-44" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      </g>
      <g fill="currentColor">
        <circle cx="188" cy="32" r="4.5" />
        <circle cx="76" cy="70" r="3.5" opacity="0.8" />
        <circle cx="128" cy="76" r="3.5" opacity="0.8" />
        {Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={24 + (i % 6) * 13} cy={18 + Math.floor(i / 6) * 13} r="1.6" opacity="0.3" />
        ))}
      </g>
    </svg>
  );
}

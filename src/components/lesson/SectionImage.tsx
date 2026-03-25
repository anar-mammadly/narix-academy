import { UniformImage } from "./UniformImage";

export function SectionImage({ url }: { url: string | null | undefined }) {
  if (!url) return null;
  return (
    <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Bölmə şəkli</p>
      <UniformImage src={url} alt="Bölmə şəkli" caption={null} alignment="center" />
    </div>
  );
}

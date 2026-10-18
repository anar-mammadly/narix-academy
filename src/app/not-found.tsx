import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md text-center">
        <Logo className="justify-center" />
        <p className="mt-10 font-mono text-sm text-bug">404 · Not Found</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Bu səhifə tapılmadı</h1>
        <p className="mt-3 text-ink-2">Ünvan səhv yazılıb və ya dərs artıq başqa yerdədir. Bu, baq deyil — sadəcə yol başqadır.</p>
        <Link href="/dashboard" className={`${buttonStyles({ size: "lg" })} mt-6`}>Ana səhifəyə qayıt</Link>
      </div>
    </main>
  );
}

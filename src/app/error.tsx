"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="grid min-h-[60dvh] place-items-center px-5">
      <div className="max-w-md text-center" role="alert">
        <p className="font-mono text-sm text-bug">500 · Gözlənilməz xəta</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Səhifə yüklənmədi</h1>
        <p className="mt-3 text-ink-2">Bir az sonra yenidən cəhd et. Problem qalsa, müəllimə xəta kodunu göndər{error.digest ? `: ${error.digest}` : ""}.</p>
        <Button onClick={reset} className="mt-6"><RotateCcw className="h-4 w-4" aria-hidden /> Yenidən cəhd et</Button>
      </div>
    </main>
  );
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Maps thrown errors to the right HTTP status instead of a blanket 401. */
export function apiError(e: unknown) {
  if (e instanceof ZodError) {
    return NextResponse.json({ error: "Məlumat düzgün deyil", issues: e.issues }, { status: 400 });
  }
  const message = e instanceof Error ? e.message : "Xəta baş verdi";
  if (message === "Unauthorized") return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  if (message === "Forbidden") return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  console.error(e);
  return NextResponse.json({ error: "Serverdə xəta baş verdi" }, { status: 500 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch (err) {
    // Debug: production-da dəqiq nə çökdüyünü logla.
    console.error("[POST /api/auth/login] Failed to parse request body:", err);
    return NextResponse.json({ error: "Yanlış sorğu" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "E-poçt və ya şifrə yanlışdır" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "E-poçt və ya şifrə yanlışdır" }, { status: 401 });
    }

    const token = createSessionToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });
    if (!token) {
      return NextResponse.json({ error: "Server konfiqurasiyası" }, { status: 500 });
    }

    const res = NextResponse.json({
      ok: true,
      role: user.role,
    });

    // If we're behind a proxy/load balancer (e.g. Vercel), `x-forwarded-proto` tells us
    // whether the original request was HTTPS. `secure` cookies require HTTPS.
    const isSecure =
      req.headers.get("x-forwarded-proto") === "https" ||
      process.env.NODE_ENV === "production";
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: isSecure,
    });
    return res;
  } catch (err) {
    // Debug: production-da dəqiq nə çökdüyünü logla və müvəqqəti message qaytar.
    console.error("[POST /api/auth/login] Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", message: (err as any).message },
      { status: 500 }
    );
  }
}

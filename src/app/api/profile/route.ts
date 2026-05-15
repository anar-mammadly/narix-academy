import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, signToken } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const { name, bio, phone, language } = await req.json();
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name, bio, phone, language },
    });
    // Refresh session token
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, language: user.language });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

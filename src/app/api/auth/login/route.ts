import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiError } from "@/lib/api";

const Body = z.object({ email: z.string().email("Email düzgün deyil"), password: z.string().min(1, "Şifrə tələb olunur") });

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Email və şifrəni daxil et" }, { status: 400 });
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Email və ya şifrə yanlışdır" }, { status: 401 });

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, language: user.language ?? "az" });
    const res = NextResponse.json({ role: user.role });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (e) {
    return apiError(e);
  }
}

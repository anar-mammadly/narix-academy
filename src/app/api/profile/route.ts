import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, signToken } from "@/lib/auth";
import { apiError } from "@/lib/api";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().max(200).optional(),
  dailyGoalXp: z.union([z.literal(10), z.literal(30), z.literal(50), z.literal(80)]).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const data = Body.parse(await req.json());
    const user = await prisma.user.update({ where: { id: session.userId }, data });
    const token = await signToken({ userId: user.id, email: user.email, name: user.name, role: user.role, language: user.language });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return res;
  } catch (e) {
    return apiError(e);
  }
}

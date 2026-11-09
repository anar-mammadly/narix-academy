import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

const statusSchema = z.object({ isActive: z.boolean() }).strict();
type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Context) {
  try {
    await requireTeacher();
    const { id } = await ctx.params;
    const { isActive } = statusSchema.parse(await req.json());
    const result = await prisma.user.updateMany({
      where: { id, role: "STUDENT" },
      data: { isActive, sessionVersion: { increment: 1 } },
    });
    if (!result.count) throw new HttpError(404, "Tələbə tapılmadı");
    return NextResponse.json({ id, isActive });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Context) {
  try {
    await requireTeacher();
    const { id } = await ctx.params;
    const result = await prisma.user.deleteMany({ where: { id, role: "STUDENT" } });
    if (!result.count) throw new HttpError(404, "Tələbə tapılmadı");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

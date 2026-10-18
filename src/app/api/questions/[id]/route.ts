import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({ status: z.enum(["OPEN", "ANSWERED", "CLOSED"]), pinned: z.boolean() })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Dəyişiklik yoxdur");

/** Teacher moderation: change status (open / answered / closed) or pin. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const body = patchSchema.parse(await req.json());
    const exists = await prisma.question.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new HttpError(404, "Sual tapılmadı");
    const q = await prisma.question.update({ where: { id }, data: body, select: { id: true, status: true, pinned: true } });
    return NextResponse.json(q);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireTeacher();
    const { id } = await params;
    const exists = await prisma.question.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new HttpError(404, "Sual tapılmadı");
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

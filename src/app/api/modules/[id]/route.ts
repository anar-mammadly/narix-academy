import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  published: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const p = (params as unknown) as { id: string } | Promise<{ id: string }>;
  const { id } = await p;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Yanlış JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const mod = await prisma.module.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ module: mod });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const p = (params as unknown) as { id: string } | Promise<{ id: string }>;
  const { id } = await p;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  await prisma.module.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { lessons: true } } },
  });
  return NextResponse.json({ modules });
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  published: z.boolean().optional(),
});

export async function POST(req: Request) {
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
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const maxOrder = await prisma.module.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? -1) + 1;
  const mod = await prisma.module.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      published: parsed.data.published ?? false,
      order,
    },
  });
  return NextResponse.json({ module: mod });
}

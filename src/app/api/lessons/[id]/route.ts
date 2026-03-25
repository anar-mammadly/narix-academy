import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { pruneUndefined } from "@/lib/prune";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .optional()
    .transform((s) => (s === undefined ? undefined : s.trim() === "" ? undefined : s.trim())),
  shortDescription: z.string().nullable().optional(),
  moduleId: z.string().optional(),
  order: z.number().int().optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(24 * 60).optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional(),
  quizEnabled: z.boolean().optional(),
  minQuizScore: z.number().int().min(0).max(100).nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const p = (params as unknown) as { id: string } | Promise<{ id: string }>;
  const { id } = await p;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      module: true,
      blocks: { orderBy: { order: "asc" } },
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  }
  return NextResponse.json({ lesson });
}

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
  const raw = { ...parsed.data };
  if (raw.title && raw.slug === undefined) {
    raw.slug = slugify(raw.title);
  }
  if (raw.slug) {
    let slug = raw.slug;
    const base = slug;
    let n = 0;
    while (
      await prisma.lesson.findFirst({
        where: { slug, NOT: { id } },
      })
    ) {
      n += 1;
      slug = `${base}-${n}`;
    }
    raw.slug = slug;
  }
  const data = pruneUndefined(raw as Record<string, unknown>);
  const lesson = await prisma.lesson.update({
    where: { id },
    data,
  });
  return NextResponse.json({ lesson });
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
  await prisma.lesson.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}

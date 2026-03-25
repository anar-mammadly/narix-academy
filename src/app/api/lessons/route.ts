import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId") ?? undefined;
  const published = searchParams.get("published");
  const q = searchParams.get("q")?.trim();

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(moduleId ? { moduleId } : {}),
      ...(published === "true" ? { published: true } : {}),
      ...(published === "false" ? { published: false } : {}),
      ...(q
        ? {
            title: { contains: q },
          }
        : {}),
    },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    include: {
      module: { select: { id: true, title: true } },
      _count: { select: { blocks: true } },
    },
  });

  return NextResponse.json({ lessons });
}

const createSchema = z.object({
  title: z.string().min(1),
  moduleId: z.string().min(1),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional(),
  quizEnabled: z.boolean().optional(),
  minQuizScore: z.number().int().min(0).max(100).nullable().optional(),
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
  const d = parsed.data;
  const baseSlug = d.slug?.trim() || slugify(d.title);
  let slug = baseSlug;
  let n = 0;
  while (await prisma.lesson.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  const maxOrder = await prisma.lesson.aggregate({
    where: { moduleId: d.moduleId },
    _max: { order: true },
  });
  const order = (maxOrder._max.order ?? -1) + 1;
  const lesson = await prisma.lesson.create({
    data: {
      title: d.title,
      slug,
      shortDescription: d.shortDescription ?? null,
      moduleId: d.moduleId,
      order,
      estimatedMinutes: d.estimatedMinutes ?? 30,
      coverImageUrl: d.coverImageUrl ?? null,
      published: d.published ?? false,
      quizEnabled: d.quizEnabled ?? false,
      minQuizScore: d.minQuizScore ?? null,
    },
  });
  return NextResponse.json({ lesson });
}

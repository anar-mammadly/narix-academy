import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSession } from "@/server/auth";
import { slugify } from "@/server/lib/slugify";

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (await prisma.lesson.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const p = (params as unknown) as { id: string } | Promise<{ id: string }>;
  const { id } = await p;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const src = await prisma.lesson.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  if (!src) {
    return NextResponse.json({ error: "Tapılmadı" }, { status: 404 });
  }
  const baseSlug = slugify(`${src.title}-kopya`);
  const slug = await uniqueSlug(baseSlug);
  const maxOrder = await prisma.lesson.aggregate({
    where: { moduleId: src.moduleId },
    _max: { order: true },
  });
  const order = (maxOrder._max.order ?? -1) + 1;
  const lesson = await prisma.lesson.create({
    data: {
      title: `${src.title} (kopya)`,
      slug,
      shortDescription: src.shortDescription,
      moduleId: src.moduleId,
      order,
      estimatedMinutes: src.estimatedMinutes,
      coverImageUrl: src.coverImageUrl,
      published: false,
      quizEnabled: src.quizEnabled,
      minQuizScore: src.minQuizScore,
      blocks: {
        create: src.blocks.map((b) => ({
          type: b.type,
          title: b.title,
          content: b.content,
          settings: b.settings,
          imageUrl: b.imageUrl,
          order: b.order,
        })),
      },
    },
  });
  return NextResponse.json({ lesson });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  moduleId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)),
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
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const { moduleId, orderedIds } = parsed.data;
  await prisma.$transaction(
    orderedIds.map((lessonId, index) =>
      prisma.lesson.updateMany({
        where: { id: lessonId, moduleId },
        data: { order: index },
      })
    )
  );
  return NextResponse.json({ ok: true });
}

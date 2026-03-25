import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
  const { orderedIds } = parsed.data;
  const lessonId = params.id;
  await prisma.$transaction(
    orderedIds.map((blockId, index) =>
      prisma.lessonBlock.updateMany({
        where: { id: blockId, lessonId },
        data: { order: index },
      })
    )
  );
  return NextResponse.json({ ok: true });
}

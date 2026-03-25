import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const getSchema = z.object({
  studentId: z.string().min(1),
});

const updateSchema = z.object({
  studentId: z.string().min(1),
  hiddenModuleIds: z.array(z.string().min(1)),
  hiddenLessonIds: z.array(z.string().min(1)),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const studentIdRaw = searchParams.get("studentId");
  const parsed = getSchema.safeParse({ studentId: studentIdRaw });
  if (!parsed.success) {
    return NextResponse.json({ error: "studentId tələb olunur" }, { status: 400 });
  }

  const studentId = parsed.data.studentId;

  const hiddenModules = await prisma.studentContentVisibility.findMany({
    where: { studentId, visible: false, lessonId: null },
    select: { moduleId: true },
  });
  const hiddenModuleIds = hiddenModules.map((x) => x.moduleId!).filter(Boolean);

  const hiddenLessons = await prisma.studentContentVisibility.findMany({
    where: { studentId, visible: false, lessonId: { not: null } },
    select: { lessonId: true },
  });
  const hiddenLessonIds = hiddenLessons.map((x) => x.lessonId!).filter(Boolean);

  return NextResponse.json({ studentId, hiddenModuleIds, hiddenLessonIds });
}

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

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }

  const { studentId, hiddenModuleIds, hiddenLessonIds } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.studentContentVisibility.deleteMany({ where: { studentId } });

    if (hiddenModuleIds.length > 0) {
      await tx.studentContentVisibility.createMany({
        data: hiddenModuleIds.map((moduleId) => ({
          studentId,
          moduleId,
          lessonId: null,
          visible: false,
        })),
      });
    }

    if (hiddenLessonIds.length > 0) {
      await tx.studentContentVisibility.createMany({
        data: hiddenLessonIds.map((lessonId) => ({
          studentId,
          moduleId: null,
          lessonId,
          visible: false,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}


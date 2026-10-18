import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

const gradeSchema = z.object({
  submitId: z.string().min(1),
  grade: z.number({ invalid_type_error: "Qiymət rəqəm olmalıdır" }).int("Qiymət tam ədəd olmalıdır").min(0, "Qiymət 0–100 arasındadır").max(100, "Qiymət 0–100 arasındadır"),
  feedback: z.string().trim().max(3000).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { submitId, grade, feedback } = gradeSchema.parse(await req.json());
    const existing = await prisma.homeworkSubmit.findUnique({ where: { id: submitId }, select: { id: true } });
    if (!existing) throw new HttpError(404, "Cavab tapılmadı");
    const updated = await prisma.homeworkSubmit.update({
      where: { id: submitId },
      data: { grade, feedback: feedback || null, status: "GRADED" },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return fail(e);
  }
}

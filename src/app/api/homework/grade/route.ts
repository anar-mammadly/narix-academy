import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { submitId, grade, feedback } = await req.json();
    const updated = await prisma.homeworkSubmit.update({
      where: { id: submitId },
      data: { grade, feedback, status: "GRADED" },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

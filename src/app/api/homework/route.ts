import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { lessonId, title, description, dueDate } = await req.json();
    if (!lessonId || !title?.trim()) return NextResponse.json({ error: "Tələb olunan sahələr boşdur" }, { status: 400 });
    const hw = await prisma.homework.create({
      data: { lessonId, title, description: description ?? "", dueDate: dueDate ? new Date(dueDate) : null },
    });
    return NextResponse.json(hw, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

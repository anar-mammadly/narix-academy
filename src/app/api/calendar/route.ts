import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacher();
    const { title, description, startAt, endAt, type, meetLink } = await req.json();
    if (!title?.trim() || !startAt) return NextResponse.json({ error: "Başlıq və vaxt tələb olunur" }, { status: 400 });
    const ev = await prisma.calendarEvent.create({
      data: {
        createdById: session.userId,
        title,
        description: description ?? "",
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        type: type ?? "CLASS",
        meetLink: meetLink || null,
      },
    });
    return NextResponse.json(ev, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

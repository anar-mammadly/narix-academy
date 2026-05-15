import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireTeacher();
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, createdAt: true, language: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(students);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { name, email, password } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Bütün sahələr tələb olunur" }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "Bu e-poçt artıq mövcuddur" }, { status: 409 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash, role: "STUDENT" },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
}

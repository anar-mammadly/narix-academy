import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { HttpError, fail } from "@/app/api/lessons/_lib";

const createSchema = z.object({
  name: z.string().trim().min(2, "Ad ən az 2 simvol olmalıdır").max(120),
  email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil").max(200),
  password: z.string().min(8, "Şifrə ən az 8 simvol olmalıdır").max(200),
  language: z.enum(["az", "en"]).optional(),
});

export async function GET() {
  try {
    await requireTeacher();
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true, createdAt: true, language: true, xp: true, streakCount: true, lastActiveDay: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(students);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { name, email, password, language } = createSchema.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new HttpError(409, "Bu e-poçt ilə hesab artıq mövcuddur");
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "STUDENT", language: language ?? "az" },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

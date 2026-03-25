import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { getSession, hashPassword } from "@/server/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: {
      progress: {
        include: { lesson: { select: { title: true, id: true } } },
      },
      submissions: { select: { id: true } },
    },
  });
  const shaped = students.map((u) => {
    const completed = u.progress.filter((p) => p.completed).length;
    const quizScores = u.progress.filter((p) => p.quizScore != null).map((p) => p.quizScore as number);
    const quizAvg =
      quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      completedLessons: completed,
      submissionCount: u.submissions.length,
      quizAverage: quizAvg,
    };
  });
  return NextResponse.json({ students: shaped });
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  generatePassword: z.boolean().optional(),
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
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Bu e-poçt artıq qeydiyyatdadır" }, { status: 409 });
  }
  let plain: string;
  if (parsed.data.generatePassword) {
    plain = Math.random().toString(36).slice(2, 10) + "A1!";
  } else if (parsed.data.password) {
    plain = parsed.data.password;
  } else {
    return NextResponse.json({ error: "Şifrə və ya avto-yaratma seçin" }, { status: 400 });
  }
  const passwordHash = await hashPassword(plain);
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: "STUDENT",
      passwordHash,
    },
    select: { id: true, email: true, name: true },
  });
  return NextResponse.json({ user, generatedPassword: parsed.data.generatePassword ? plain : undefined });
}

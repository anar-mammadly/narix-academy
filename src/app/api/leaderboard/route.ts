import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const [students, allProgress, totalLessons] = await Promise.all([
      prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true } }),
      prisma.progress.findMany({ where: { user: { role: "STUDENT" } } }),
      prisma.lesson.count({ where: { published: true } }),
    ]);

    const board = students.map(s => {
      const prog = allProgress.filter(p => p.userId === s.id);
      const completed = prog.filter(p => p.completed).length;
      const passed = prog.filter(p => p.quizPassed);
      const avgScore = passed.length ? Math.round(passed.reduce((a, p) => a + (p.quizScore ?? 0), 0) / passed.length) : 0;
      const points = completed * 10 + passed.length * 5 + avgScore;
      return { ...s, completed, avgScore, points, pct: Math.round((completed / (totalLessons || 1)) * 100) };
    }).sort((a, b) => b.points - a.points);

    return NextResponse.json({ board, totalLessons });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { COURSE_TITLE, getCertificateProgress } from "./eligibility";

/** Claim the course certificate. The 80% rule is enforced here, not only in the UI. */
export async function POST() {
  try {
    const session = await requireSession();
    if (session.role !== "STUDENT") throw new Error("Forbidden");

    const existing = await prisma.certificate.findFirst({
      where: { userId: session.userId },
      orderBy: { issuedAt: "asc" },
      select: { code: true, issuedAt: true },
    });
    if (existing) return NextResponse.json(existing);

    const progress = await getCertificateProgress(session.userId);
    if (!progress.eligible) {
      return NextResponse.json(
        { error: `Sertifikat üçün dərslərin ən azı 80%-ni bitir. Daha ${progress.needed} dərs qalıb.` },
        { status: 403 }
      );
    }

    const cert = await prisma.certificate.create({
      data: { userId: session.userId, title: COURSE_TITLE },
      select: { code: true, issuedAt: true },
    });
    return NextResponse.json(cert, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

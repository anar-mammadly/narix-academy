import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { fail } from "@/app/api/lessons/_lib";

const date = (msg: string) =>
  z
    .string()
    .min(1, msg)
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), msg);

const createSchema = z
  .object({
    title: z.string().trim().min(1, "Başlıq tələb olunur").max(200),
    description: z.string().trim().max(3000).optional().default(""),
    startAt: date("Başlama vaxtı düzgün deyil"),
    endAt: z.union([date("Bitmə vaxtı düzgün deyil"), z.literal("").transform(() => null), z.null()]).optional(),
    type: z.enum(["CLASS", "EXAM", "DEADLINE", "OTHER"]).default("CLASS"),
    meetLink: z.union([z.string().trim().url("Keçid düzgün URL deyil").max(1000), z.literal("")]).optional(),
  })
  .refine((v) => !v.endAt || v.endAt > v.startAt, { message: "Bitmə vaxtı başlamadan sonra olmalıdır", path: ["endAt"] });

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacher();
    const body = createSchema.parse(await req.json());
    const ev = await prisma.calendarEvent.create({
      data: {
        createdById: session.userId,
        title: body.title,
        description: body.description,
        startAt: body.startAt,
        endAt: body.endAt ?? null,
        type: body.type,
        meetLink: body.meetLink || null,
      },
      include: { createdBy: { select: { name: true } } },
    });
    return NextResponse.json(ev, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { getAppearance, saveAppearance } from "@/lib/site-settings";

const schema = z
  .object({
    dashboardCharts: z.boolean(),
    adminCharts: z.boolean(),
    moduleArt: z.boolean(),
    lessonVisuals: z.boolean(),
    loginArt: z.boolean(),
    // an uploaded file's address or an https link; empty = use the built-in illustration
    loginImageUrl: z.string().trim().max(600).refine((v) => v === "" || /^https:\/\//.test(v) || v.startsWith("/"), "Keçid https:// ilə başlamalıdır"),
  })
  .partial()
  .strict();

export async function GET() {
  try {
    await requireTeacher();
    return NextResponse.json(await getAppearance());
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireTeacher();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Məlumat düzgün deyil" }, { status: 400 });
    return NextResponse.json(await saveAppearance(parsed.data));
  } catch (e) {
    return apiError(e);
  }
}

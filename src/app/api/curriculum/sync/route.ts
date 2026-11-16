import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { applyCurriculum, planCurriculum } from "@/lib/curriculum-sync";

// creating twenty lessons with their blocks takes a few seconds
export const maxDuration = 60;

/** What adding the lessons from the curriculum files would change. Changes nothing. */
export async function GET() {
  try {
    await requireTeacher();
    return NextResponse.json(await planCurriculum());
  } catch (e) {
    return apiError(e);
  }
}

/** Adds the modules and lessons that are in the files but not in the database yet. */
export async function POST() {
  try {
    await requireTeacher();
    const result = await applyCurriculum();
    if (!result.ok) return NextResponse.json({ error: "Kurikulum fayllarında xəta var", plan: result.plan }, { status: 422 });
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}

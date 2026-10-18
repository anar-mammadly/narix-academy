import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacher } from "@/lib/auth";
import { getPresignedPutUrl, publicUrlForKey } from "@/lib/r2";
import { ALLOWED_VIDEO_TYPES, ALLOWED_VIDEO_EXTENSIONS, MAX_VIDEO_SIZE_MB } from "@/lib/constants";
import { fail } from "@/app/api/lessons/_lib";

const presignSchema = z.object({
  contentType: z.string().refine((t) => ALLOWED_VIDEO_TYPES.includes(t), "Dəstəklənməyən fayl formatı (MP4, WebM, MOV)"),
  size: z
    .number()
    .positive("Fayl boşdur")
    .max(MAX_VIDEO_SIZE_MB * 1024 * 1024, `Fayl ölçüsü ${MAX_VIDEO_SIZE_MB}MB-dan çox ola bilməz`),
});

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { contentType } = presignSchema.parse(await req.json());
    const ext = ALLOWED_VIDEO_EXTENSIONS[contentType];
    const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadUrl = await getPresignedPutUrl(key, contentType);
    return NextResponse.json({ uploadUrl, publicUrl: publicUrlForKey(key), key });
  } catch (e) {
    return fail(e);
  }
}

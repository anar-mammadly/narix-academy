import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { getPresignedPutUrl, publicUrlForKey } from "@/lib/r2";
import { ALLOWED_VIDEO_TYPES, ALLOWED_VIDEO_EXTENSIONS, MAX_VIDEO_SIZE_MB } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const { contentType, size } = await req.json();

    if (!ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Dəstəklənməyən fayl formatı" }, { status: 400 });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Fayl ölçüsü ${MAX_VIDEO_SIZE_MB}MB-dan çox ola bilməz` }, { status: 400 });
    }

    const ext = ALLOWED_VIDEO_EXTENSIONS[contentType];
    const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const uploadUrl = await getPresignedPutUrl(key, contentType);
    const publicUrl = publicUrlForKey(key);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (e: any) {
    const status = e.message === "Unauthorized" ? 401 : e.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

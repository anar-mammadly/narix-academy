import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import sharp from "sharp";
import { putObject } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buffer)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const url = await putObject(key, processed, "image/webp");

    return NextResponse.json({ url });
  } catch (e: any) {
    const status = e.message === "Unauthorized" ? 401 : e.message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

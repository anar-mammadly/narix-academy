import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireTeacher } from "@/lib/auth";
import { putObject } from "@/lib/r2";
import { HttpError, fail } from "@/app/api/lessons/_lib";

const MAX_IMAGE_MB = 10;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "Fayl tapılmadı");
    if (!ALLOWED.includes(file.type)) throw new HttpError(400, "Yalnız PNG, JPG, WebP, GIF və AVIF şəkilləri qəbul olunur");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new HttpError(400, `Şəkil ${MAX_IMAGE_MB}MB-dan böyük ola bilməz`);

    const buffer = Buffer.from(await file.arrayBuffer());
    let processed: Buffer;
    try {
      processed = await sharp(buffer).rotate().resize(1600, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch {
      throw new HttpError(400, "Şəkil oxunmadı. Başqa fayl seçin.");
    }

    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const url = await putObject(key, processed, "image/webp");
    return NextResponse.json({ url });
  } catch (e) {
    return fail(e);
  }
}

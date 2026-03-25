import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { optimizeLessonImage } from "@/lib/image-optimize";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Form məlumatı oxunmadı" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fayl seçilməyib" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Fayl çox böyükdür (max 5MB)" }, { status: 400 });
  }
  const mime = file.type;
  if (!ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: "Yalnız JPEG, PNG, WebP və GIF qəbul edilir" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  let optimized: Buffer;
  try {
    optimized = await optimizeLessonImage(buf);
  } catch (e) {
    if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
      return NextResponse.json({ error: "Fayl çox böyükdür" }, { status: 400 });
    }
    return NextResponse.json({ error: "Şəkil emal edilə bilmədi" }, { status: 400 });
  }
  const name = `${randomUUID()}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await writeFile(full, optimized);
  const url = `/uploads/${name}`;
  return NextResponse.json({ url, filename: name });
}

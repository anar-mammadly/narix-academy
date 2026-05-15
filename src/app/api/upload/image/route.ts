import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    await requireTeacher();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(buffer).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 85 }).toFile(filepath);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

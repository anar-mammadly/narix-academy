import sharp from "sharp";
import { MAX_UPLOAD_BYTES } from "@/server/config/constants";

export async function optimizeLessonImage(buffer: Buffer): Promise<Buffer> {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  return sharp(buffer)
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

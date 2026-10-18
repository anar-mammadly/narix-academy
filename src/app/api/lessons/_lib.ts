import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBlock } from "@/lib/block-schema";
import { Prisma, type LessonBlock } from "@prisma/client";
import { ZodError } from "zod";
import { apiError } from "@/lib/api";
import { slugify } from "@/lib/utils";

/** Thrown inside handlers to return a specific status with a readable message. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Error → response: HttpError, common Prisma codes, then the shared apiError mapping. */
export function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") return NextResponse.json({ error: "Qeyd tapılmadı" }, { status: 404 });
    if (e.code === "P2002") return NextResponse.json({ error: "Bu dəyər artıq istifadə olunur" }, { status: 409 });
    if (e.code === "P2003") return NextResponse.json({ error: "Əlaqəli qeyd tapılmadı" }, { status: 400 });
  }
  if (e instanceof ZodError) {
    const first = e.issues[0];
    const where = first?.path.length ? `${first.path.join(".")}: ` : "";
    return NextResponse.json({ error: `${where}${first?.message ?? "Məlumat düzgün deyil"}`, issues: e.issues }, { status: 400 });
  }
  if (e instanceof SyntaxError) return NextResponse.json({ error: "Sorğunun gövdəsi JSON deyil" }, { status: 400 });
  return apiError(e);
}

/** Block content arrives as an object, or (legacy/import) as a JSON string. */
export function coerceContent(content: unknown): unknown {
  if (typeof content !== "string") return content;
  try {
    return JSON.parse(content);
  } catch {
    throw new HttpError(400, "content: JSON düzgün deyil");
  }
}

/** Validates a block with validateBlock and returns DB-ready fields, or throws 400. */
export function prepareBlock(raw: { type?: unknown; title?: unknown; content?: unknown; imageUrl?: unknown }, label = "Blok") {
  const result = validateBlock({ ...raw, content: coerceContent(raw.content) });
  if (!result.ok) throw new HttpError(400, `${label}: ${result.error}`);
  const { block } = result;
  return {
    type: block.type,
    title: block.title?.trim() ? block.title.trim() : null,
    content: JSON.stringify(block.content ?? {}),
    imageUrl: block.imageUrl ?? null,
  };
}

export async function requireLesson(id: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id }, select: { id: true, moduleId: true } });
  if (!lesson) throw new HttpError(404, "Dərs tapılmadı");
  return lesson;
}

export async function requireBlockInLesson(lessonId: string, blockId: string) {
  const block = await prisma.lessonBlock.findUnique({ where: { id: blockId } });
  if (!block || block.lessonId !== lessonId) throw new HttpError(404, "Blok bu dərsdə tapılmadı");
  return block;
}

/** Shape sent to the editor: content parsed back into an object. */
export function serializeBlock(b: LessonBlock) {
  let content: unknown = {};
  try {
    content = JSON.parse(b.content);
  } catch {
    content = {};
  }
  return { id: b.id, type: b.type, title: b.title, content, imageUrl: b.imageUrl, order: b.order };
}

export async function lessonBlocks(lessonId: string) {
  const blocks = await prisma.lessonBlock.findMany({ where: { lessonId }, orderBy: { order: "asc" } });
  return blocks.map(serializeBlock);
}

/** Picks a slug that is not taken yet: base, base-2, base-3, … */
export async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "ders";
  const taken = await prisma.lesson.findMany({
    where: { slug: { startsWith: root }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(root)) return root;
  for (let i = 2; ; i++) if (!set.has(`${root}-${i}`)) return `${root}-${i}`;
}

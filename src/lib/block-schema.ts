// Runtime validation for lesson block content (mirrors src/types/blocks.ts).
// Used by the curriculum sync script, the admin JSON import and the block API.
import { z } from "zod";
import { BLOCK_TYPES, type BlockType } from "@/types/blocks";

const str = z.string();
const text = z.string().min(1);
const choice = z.object({ id: text, text: text, options: z.array(text).min(2).max(4), correctIndex: z.number().int().min(0), explanation: str.optional(), imageUrl: str.nullable().optional() })
  .refine((q) => q.correctIndex < q.options.length, { message: "correctIndex variantlardan kənardadır" });

export const contentSchemas: Record<BlockType, z.ZodTypeAny> = {
  HEADING: z.object({ text: text, level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2) }),
  TEXT: z.object({ body: str, highlight: z.enum(["normal", "info", "warning", "success"]).optional() }),
  OBJECTIVES: z.object({ items: z.array(text).min(1) }),
  KEY_TERMS: z.object({ terms: z.array(z.object({ term: text, az: str.optional(), definition: text })).min(1) }),
  IMAGE: z.object({ url: str, caption: str.optional(), alt: str.default(""), alignment: z.enum(["left", "center", "right"]).optional() }),
  VIDEO: z.object({ url: str, source: z.enum(["upload", "external"]), caption: str.optional(), thumbnailUrl: str.nullable().optional(), durationSeconds: z.number().nullable().optional() }),
  EXAMPLE: z.object({ description: str, takeaway: str.optional(), relatedImageUrl: str.nullable().optional() }),
  TABLE: z.object({ headers: z.array(str).min(1), rows: z.array(z.array(str)) }),
  NOTE: z.object({ variant: z.enum(["important", "remember", "tip", "warning"]), body: str }),
  CALLOUT: z.object({ emoji: str.optional(), title: str, body: str, color: z.enum(["blue", "green", "yellow", "red", "purple"]) }),
  STEPPER: z.object({ steps: z.array(z.object({ title: text, description: str, icon: str.optional() })).min(1) }),
  CODE: z.object({ code: str, language: str, caption: str.optional() }),
  DIAGRAM: z.object({ code: text, caption: str.optional() }),
  CHECKLIST: z.object({ items: z.array(z.object({ id: text, text: text })).min(1) }),
  SUMMARY: z.object({ points: z.array(text).min(1) }),
  DIVIDER: z.object({}).passthrough(),
  QUIZ: z.object({ questions: z.array(choice).min(1) }),
  ORDERING: z.object({ instructions: str, items: z.array(text).min(2), explanation: str.optional() })
    .refine((o) => new Set(o.items).size === o.items.length, { message: "Sıralama elementləri təkrarlanmamalıdır" }),
  CATEGORIZE: z.object({
    instructions: str,
    categories: z.array(z.object({ id: text, label: text })).min(2),
    items: z.array(z.object({ id: text, text: text, categoryId: text })).min(2),
    explanation: str.optional(),
  }).refine((c) => c.items.every((i) => c.categories.some((k) => k.id === i.categoryId)), { message: "Element mövcud olmayan kateqoriyaya bağlanıb" }),
  CODE_EXERCISE: z.object({
    language: z.literal("javascript"),
    instructions: text,
    starterCode: str,
    solution: text,
    tests: z.array(z.object({ name: text, assert: text })).min(1),
    hints: z.array(text).optional(),
  }),
  BUG_HUNT: z.object({ scenario: z.enum(["login", "registration", "cart"]), instructions: str }),
  TEST_CASE_BUILDER: z.object({
    feature: text,
    requirement: text,
    minSteps: z.number().int().min(1).max(12),
    expectedKeywords: z.array(text),
    sampleSolution: z.object({ title: text, preconditions: str, steps: z.array(text).min(1), expected: text }),
  }),
  BUG_REPORT_BUILDER: z.object({
    scenario: text,
    expectedSeverity: z.enum(["Critical", "Major", "Minor", "Trivial"]),
    expectedPriority: z.enum(["High", "Medium", "Low"]),
    keywords: z.array(text),
    sampleSolution: z.object({ title: text, steps: z.array(text).min(1), expected: text, actual: text }),
  }),
  API_PLAYGROUND: z.object({
    instructions: str,
    baseUrl: text,
    endpoints: z.array(z.object({
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
      path: text,
      status: z.number().int().min(100).max(599),
      body: z.unknown(),
      description: str.optional(),
    })).min(1),
    tasks: z.array(choice.innerType().omit({ text: true, imageUrl: true }).extend({ question: text })).min(1),
  }),
  TASK: z.object({ instructions: text, placeholder: str.optional(), required: z.boolean().optional() }),
};

export const blockInputSchema = z.object({
  id: z.string().optional(),
  type: z.enum(BLOCK_TYPES),
  title: z.string().nullable().optional(),
  content: z.unknown(),
  imageUrl: z.string().nullable().optional(),
});

export type BlockInput = z.infer<typeof blockInputSchema>;

/** Validates a block and returns normalised content, or a readable error. */
export function validateBlock(raw: unknown): { ok: true; block: BlockInput & { content: unknown } } | { ok: false; error: string } {
  const base = blockInputSchema.safeParse(raw);
  if (!base.success) return { ok: false, error: base.error.issues.map((i) => `${i.path.join(".") || "blok"}: ${i.message}`).join("; ") };
  const content = contentSchemas[base.data.type].safeParse(base.data.content ?? {});
  if (!content.success) {
    return { ok: false, error: `${base.data.type}: ` + content.error.issues.map((i) => `${i.path.join(".") || "content"} — ${i.message}`).join("; ") };
  }
  return { ok: true, block: { ...base.data, content: content.data } };
}

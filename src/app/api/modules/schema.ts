import { z } from "zod";

export const MODULE_ICONS = ["BookOpen", "Bot", "Bug", "ClipboardList", "FileCheck2", "Layers", "PenTool", "Sparkles", "Workflow", "Wrench"] as const;

export const moduleFields = z.object({
  title: z.string().trim().min(1, "Başlıq tələb olunur").max(200),
  titleEn: z.string().trim().max(200).nullish(),
  description: z.string().trim().max(2000).nullish(),
  descriptionEn: z.string().trim().max(2000).nullish(),
  published: z.boolean().optional(),
  icon: z.enum(MODULE_ICONS).optional(),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Rəng #RRGGBB formatında olmalıdır").optional(),
});

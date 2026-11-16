import "server-only";
import { prisma } from "./prisma";

/** What the teacher can switch on and off under Admin → Görünüş. */
export type Appearance = {
  /** Charts on the student's home page (activity, progress by module). */
  dashboardCharts: boolean;
  /** Charts on the teacher's overview. */
  adminCharts: boolean;
  /** The drawn cover on each module of the learning path. */
  moduleArt: boolean;
  /** Pictures, diagrams and charts inside lessons. */
  lessonVisuals: boolean;
  /** The illustrated panel on the login page. */
  loginArt: boolean;
  /** Replaces the login illustration with this image when set. */
  loginImageUrl: string;
};

export const APPEARANCE_DEFAULTS: Appearance = {
  dashboardCharts: true,
  adminCharts: true,
  moduleArt: true,
  lessonVisuals: true,
  loginArt: true,
  loginImageUrl: "",
};

const KEY = "appearance";

export async function getAppearance(): Promise<Appearance> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row) return APPEARANCE_DEFAULTS;
    return { ...APPEARANCE_DEFAULTS, ...(JSON.parse(row.value) as Partial<Appearance>) };
  } catch {
    // the table is missing (migration not applied yet) or the value is not JSON:
    // the site must still render, with everything on
    return APPEARANCE_DEFAULTS;
  }
}

export async function saveAppearance(patch: Partial<Appearance>): Promise<Appearance> {
  const next = { ...(await getAppearance()), ...patch };
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(next) },
    create: { key: KEY, value: JSON.stringify(next) },
  });
  return next;
}

// Gamification rules that both server and client need (no database access here).
import type { BlockType } from "@/types/blocks";

export const BLOCK_XP: Partial<Record<BlockType, number>> = {
  QUIZ: 20,
  ORDERING: 10,
  CATEGORIZE: 10,
  CODE_EXERCISE: 25,
  BUG_HUNT: 25,
  TEST_CASE_BUILDER: 20,
  BUG_REPORT_BUILDER: 20,
  API_PLAYGROUND: 20,
};

export const LESSON_XP = 25;
export const PERFECT_QUIZ_XP = 10;
export const REVIEW_XP = 3;
export const STREAK_BONUS: Record<number, number> = { 3: 15, 7: 50, 14: 100, 30: 250, 60: 500 };

/** Cumulative XP needed to reach a level: 0, 100, 300, 600, 1000, … */
export function xpForLevel(level: number) {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, floor, next, progress: Math.round(((xp - floor) / (next - floor)) * 100), title: levelTitle(level) };
}

export function levelTitle(level: number) {
  if (level <= 1) return "Stajor tester";
  if (level <= 3) return "Junior QA";
  if (level <= 5) return "QA Engineer";
  if (level <= 7) return "Senior QA";
  if (level <= 9) return "QA Lead";
  return "Bug Hunter Legend";
}

export type AchievementDef = { key: string; title: string; description: string; icon: string; xp: number; tone: "iris" | "pass" | "bug" | "xp" | "flame" | "sky" };

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-lesson", title: "İlk addım", description: "İlk dərsini bitir", icon: "Footprints", xp: 10, tone: "iris" },
  { key: "five-lessons", title: "Ritm tutdu", description: "5 dərs bitir", icon: "Rocket", xp: 25, tone: "sky" },
  { key: "module-master", title: "Modul ustası", description: "Bir modulu tam bitir", icon: "Medal", xp: 40, tone: "xp" },
  { key: "perfect-quiz", title: "Sıfır səhv", description: "Quizdə 100% topla", icon: "Target", xp: 10, tone: "pass" },
  { key: "bug-hunter", title: "Baq ovçusu", description: "Bug Hunt-da bütün baqları tap", icon: "Bug", xp: 20, tone: "bug" },
  { key: "first-code", title: "Kod işə düşdü", description: "İlk kod tapşırığını keç", icon: "Code2", xp: 15, tone: "iris" },
  { key: "reporter", title: "Dəqiq reportçu", description: "Bug report tapşırığını keç", icon: "FileWarning", xp: 10, tone: "flame" },
  { key: "api-explorer", title: "API kəşfiyyatçısı", description: "API Playground tapşırığını keç", icon: "Network", xp: 10, tone: "sky" },
  { key: "streak-3", title: "Qığılcım", description: "3 gün ardıcıl öyrən", icon: "Flame", xp: 0, tone: "flame" },
  { key: "streak-7", title: "Alov", description: "7 gün ardıcıl öyrən", icon: "Flame", xp: 0, tone: "flame" },
  { key: "streak-30", title: "Sönməz alov", description: "30 gün ardıcıl öyrən", icon: "Flame", xp: 0, tone: "flame" },
  { key: "reviewer", title: "Yaddaş məşqçisi", description: "Təkrar bölməsində 10 düzgün cavab", icon: "Repeat", xp: 15, tone: "pass" },
  { key: "xp-500", title: "500 XP", description: "500 XP topla", icon: "Zap", xp: 0, tone: "xp" },
  { key: "xp-2000", title: "2000 XP", description: "2000 XP topla", icon: "Crown", xp: 0, tone: "xp" },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a]));

/** Leitner intervals in days for boxes 1–5. */
export const REVIEW_INTERVALS = [0, 1, 3, 7, 16, 35];

const BAKU = "Asia/Baku";

/** YYYY-MM-DD for the given instant in Baku time. */
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BAKU, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function previousDay(key: string) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Last 7 day keys ending today, oldest first. */
export function lastWeekDays(today = dayKey()) {
  const days = [today];
  for (let i = 0; i < 6; i++) days.unshift(previousDay(days[0]));
  return days;
}

export type Reward = {
  xpGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  streak: number;
  achievements: { key: string; title: string }[];
};

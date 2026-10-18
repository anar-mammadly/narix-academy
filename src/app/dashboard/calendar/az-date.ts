/**
 * Date helpers for Asia/Baku (UTC+4, no DST since 2016) with Azerbaijani names.
 * Pure arithmetic — identical output on server and client, so no hydration drift.
 */

const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const AZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
] as const;

/** Monday-first. */
export const AZ_WEEKDAYS = [
  "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə", "Bazar",
] as const;
export const AZ_WEEKDAYS_SHORT = ["B.e.", "Ç.a.", "Ç.", "C.a.", "C.", "Ş.", "B."] as const;

type DateInput = Date | string | number;

function shifted(d: DateInput) {
  return new Date(new Date(d).getTime() + BAKU_OFFSET_MS);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" of the instant in Baku. */
export function dayKey(d: DateInput): string {
  const s = shifted(d);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

export function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function makeKey(y: number, m: number, d: number): string {
  const t = new Date(Date.UTC(y, m, d));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function addDays(key: string, n: number): string {
  const { y, m, d } = parseKey(key);
  return makeKey(y, m, d + n);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(key: string): number {
  const { y, m, d } = parseKey(key);
  return (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7;
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = parseKey(fromKey);
  const b = parseKey(toKey);
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / DAY_MS);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

/** "18 oktyabr 2026" */
export function formatAzDate(d: DateInput, withYear = true): string {
  const s = shifted(d);
  const base = `${s.getUTCDate()} ${AZ_MONTHS[s.getUTCMonth()].toLocaleLowerCase("az")}`;
  return withYear ? `${base} ${s.getUTCFullYear()}` : base;
}

export function formatKey(key: string, withYear = false): string {
  const { y, m, d } = parseKey(key);
  const base = `${d} ${AZ_MONTHS[m].toLocaleLowerCase("az")}`;
  return withYear ? `${base} ${y}` : base;
}

/** "14:30" */
export function formatAzTime(d: DateInput): string {
  const s = shifted(d);
  return `${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}`;
}

/** "18 oktyabr 2026, 14:30" */
export function formatAzDateTime(d: DateInput): string {
  return `${formatAzDate(d)}, ${formatAzTime(d)}`;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ə/g, "e").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const AZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const BAKU_PARTS = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku", year: "numeric", month: "numeric", day: "numeric" });

/** "18 oktyabr 2026" in Baku time. Month names are fixed so server and browser ICU data can't disagree. */
export function formatDate(date: Date | string, lang: "az" | "en" = "az"): string {
  const parts = Object.fromEntries(BAKU_PARTS.formatToParts(new Date(date)).map((p) => [p.type, p.value]));
  if (lang === "en") return `${parts.day}.${parts.month}.${parts.year}`;
  return `${Number(parts.day)} ${AZ_MONTHS[Number(parts.month) - 1]} ${parts.year}`;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} dəq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} saat ${m} dəq` : `${h} saat`;
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

/** 1375 → "1 375": same output on server and in every browser. */
export function formatNumber(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

const AZ_ALPHABET = "aâbcçdeəfgğhxıijkqlmnoöprsştuüvyz";

/** Azerbaijani alphabetical order without relying on the runtime's ICU data. */
export function compareAz(a: string, b: string): number {
  const x = a.toLocaleLowerCase("az"), y = b.toLocaleLowerCase("az");
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    if (x[i] === y[i]) continue;
    const ix = AZ_ALPHABET.indexOf(x[i]), iy = AZ_ALPHABET.indexOf(y[i]);
    if (ix !== -1 && iy !== -1) return ix - iy;
    return x.charCodeAt(i) - y.charCodeAt(i);
  }
  return x.length - y.length;
}

/** Request timestamp for server components, passed to clients so both sides agree on "now". */
export function requestTime(): number {
  return Date.now();
}

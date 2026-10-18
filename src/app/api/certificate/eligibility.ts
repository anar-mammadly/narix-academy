import "server-only";
import { flattenPath, getStudentPath } from "@/lib/curriculum";

export const CERT_THRESHOLD = 80;
export const COURSE_TITLE = "Manual QA və Test Avtomatlaşdırma";

export type CertificateProgress = {
  total: number;
  done: number;
  pct: number;
  /** Lessons still needed to reach the threshold. */
  needed: number;
  eligible: boolean;
};

/** Progress over the published lessons this student can see. Single source of truth for the 80% rule. */
export async function getCertificateProgress(userId: string): Promise<CertificateProgress> {
  const lessons = flattenPath(await getStudentPath(userId));
  const total = lessons.length;
  const done = lessons.filter((l) => l.status === "done").length;
  const required = Math.ceil((total * CERT_THRESHOLD) / 100);
  return {
    total,
    done,
    pct: total ? Math.floor((done / total) * 100) : 0,
    needed: Math.max(0, required - done),
    eligible: total > 0 && done * 100 >= total * CERT_THRESHOLD,
  };
}

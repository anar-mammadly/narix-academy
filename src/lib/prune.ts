/** Prisma ignores `undefined` but some runtimes still pass it; strip for clean updates */
export function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const v = obj[key];
    if (v !== undefined) {
      out[key] = v;
    }
  }
  return out;
}

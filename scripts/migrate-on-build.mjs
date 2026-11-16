// Applies pending database migrations as part of the build.
//
// Without this, a deploy that needs a schema change runs new code against the
// old database until somebody remembers to run `prisma migrate deploy` — and
// every page that touches the changed table answers 500 in the meantime.
//
// - No database URL in the build environment → skipped (e.g. CI, local builds).
// - SKIP_MIGRATE=1 → skipped.
// - Vercel preview builds → skipped (only the production build migrates).
// - A pooled Neon URL is swapped for the direct one: migrations need a real
//   session, which the connection pooler does not give.
import { execSync } from "node:child_process";

const LATEST = "prisma/migrations/20261116120000_tracks_and_site_settings/migration.sql";

function directUrl() {
  const explicit = process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  if (explicit) return explicit;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("-pooler.")) parsed.hostname = parsed.hostname.replace("-pooler.", ".");
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return url;
  }
}

const url = directUrl();
// On Vercel, preview builds (pull requests) often share the production
// database. A pull request must not change the live schema before it is
// merged, so only the production build migrates.
const preview = !!process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
if (process.env.SKIP_MIGRATE === "1" || !url || preview) {
  console.log("[migrate] skipped:", preview ? "preview build" : url ? "SKIP_MIGRATE=1" : "no DATABASE_URL in this environment");
  process.exit(0);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });

try {
  run("npx prisma migrate deploy");
  console.log("[migrate] database is up to date");
} catch {
  // e.g. a database that was first created with `prisma db push` and has no
  // migration history. The latest migration is written to be repeatable, so
  // apply it directly rather than deploy code the database cannot serve.
  console.warn("[migrate] `prisma migrate deploy` failed — applying the latest migration directly");
  try {
    run(`npx prisma db execute --file ${LATEST} --schema prisma/schema.prisma`);
    console.warn("[migrate] schema brought up to date without migration history; run `prisma migrate resolve` when convenient");
  } catch {
    console.error("[migrate] could not update the database schema — stopping the build so the current version stays live");
    process.exit(1);
  }
}

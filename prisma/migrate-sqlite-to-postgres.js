"use strict";

/**
 * Migrate data from old Prisma SQLite DB to the current PostgreSQL DB.
 *
 * Reading: uses local `sqlite3` CLI (no extra Node deps).
 * Writing: uses Prisma Client (current `schema.prisma`).
 *
 * Usage:
 *   node prisma/migrate-sqlite-to-postgres.js
 *
 * Options:
 *   --sqlite <path>        Path to old sqlite file (default: ./prisma/dev.db; fallback: ./prisma/prisma/dev.db)
 *   --truncate             Truncate Postgres tables before inserting (recommended for clean migration)
 *   --skip-existing        Use Prisma createMany skipDuplicates (helps when DB already has data)
 *   --batch-size <n>       Insert batch size (default: 500)
 */

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const argv = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = argv.indexOf(name);
  if (idx === -1) return fallback;
  return argv[idx + 1] ?? fallback;
}

const SQLITE_PATH_ARG = getArg("--sqlite", null);
const TRUNCATE = argv.includes("--truncate");
const SKIP_EXISTING = argv.includes("--skip-existing");
const BATCH_SIZE = Number(getArg("--batch-size", 500));

function resolveSqlitePath() {
  const candidates = [];
  if (SQLITE_PATH_ARG) candidates.push(SQLITE_PATH_ARG);

  // Defaults relative to repo root.
  candidates.push(path.join(__dirname, "dev.db"));
  candidates.push(path.join(__dirname, "prisma", "dev.db"));

  for (const p of candidates) {
    const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
    if (fs.existsSync(abs)) return abs;
  }
  throw new Error(
    `SQLite DB not found. Checked: ${candidates
      .map((p) => (path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)))
      .join(", ")}`
  );
}

function execSqliteJson(sqlitePath, sql) {
  // sqlite3 outputs JSON array when `-json` is used.
  // Ensure we keep stdout and trim to avoid parse issues.
  // Use `execFileSync` with argv array so quotes inside SQL don't break the shell.
  const out = execFileSync("sqlite3", ["-json", sqlitePath], {
    encoding: "utf8",
    input: sql,
  }).trim();
  if (!out) return [];
  return JSON.parse(out);
}

function asBool(v) {
  // SQLite might return 0/1 integers or booleans depending on driver/version.
  if (v === null || v === undefined) return false;
  if (v === true) return true;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return Boolean(v);
}

function asDate(v) {
  if (v === null || v === undefined) return null;
  // In our SQLite, DATETIME tends to be stored as ms epoch numbers.
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return new Date(Number(v));
  return new Date(v);
}

async function insertInBatches(prisma, modelName, data, mapFn) {
  const model = prisma[modelName];
  if (!model?.createMany) throw new Error(`Prisma model not found: ${modelName}`);

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    const mapped = chunk.map(mapFn);
    console.log(`[${modelName}] inserting ${i}..${i + mapped.length - 1}`);

    await model.createMany({
      data: mapped,
      // For id conflicts (primary key), optionally skip duplicates.
      ...(SKIP_EXISTING ? { skipDuplicates: true } : {}),
    });
  }
}

async function main() {
  const sqlitePath = resolveSqlitePath();
  console.log("SQLite:", sqlitePath);

  const prisma = new PrismaClient({
    // Keep logs readable during migration.
    log: ["error", "warn"],
  });

  try {
    if (TRUNCATE) {
      console.log("Truncating Postgres tables (reverse FK order)...");
      // Delete in reverse dependency order to avoid FK issues.
      await prisma.studentContentVisibility.deleteMany({});
      await prisma.progress.deleteMany({});
      await prisma.submission.deleteMany({});
      await prisma.lessonBlock.deleteMany({});
      await prisma.lesson.deleteMany({});
      await prisma.module.deleteMany({});
      await prisma.user.deleteMany({});
    }

    // 1) User
    console.log("Reading SQLite: User...");
    const userRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "User";`
    );
    console.log(`User rows: ${userRows.length}`);

    await insertInBatches(prisma, "user", userRows, (r) => ({
      id: r.id,
      email: r.email,
      passwordHash: r.passwordHash,
      name: r.name,
      role: r.role,
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    // 2) Module
    console.log("Reading SQLite: Module...");
    const moduleRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "Module" ORDER BY "order" ASC;`
    );
    console.log(`Module rows: ${moduleRows.length}`);

    await insertInBatches(prisma, "module", moduleRows, (r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? null,
      order: r.order,
      published: asBool(r.published),
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    // 3) Lesson
    console.log("Reading SQLite: Lesson...");
    const lessonRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "Lesson" ORDER BY "moduleId" ASC, "order" ASC;`
    );
    console.log(`Lesson rows: ${lessonRows.length}`);

    await insertInBatches(prisma, "lesson", lessonRows, (r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      shortDescription: r.shortDescription ?? null,
      moduleId: r.moduleId,
      order: r.order,
      estimatedMinutes: r.estimatedMinutes,
      coverImageUrl: r.coverImageUrl ?? null,
      published: asBool(r.published),
      quizEnabled: asBool(r.quizEnabled),
      minQuizScore: r.minQuizScore ?? null,
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    // 4) LessonBlock
    console.log("Reading SQLite: LessonBlock...");
    const lessonBlockRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "LessonBlock" ORDER BY "lessonId" ASC, "order" ASC;`
    );
    console.log(`LessonBlock rows: ${lessonBlockRows.length}`);

    await insertInBatches(prisma, "lessonBlock", lessonBlockRows, (r) => ({
      id: r.id,
      lessonId: r.lessonId,
      type: r.type,
      title: r.title ?? null,
      content: r.content ?? "{}",
      settings: r.settings ?? "{}",
      imageUrl: r.imageUrl ?? null,
      order: r.order,
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    // 5) Progress
    console.log("Reading SQLite: Progress...");
    const progressRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "Progress" ORDER BY "userId" ASC, "lessonId" ASC;`
    );
    console.log(`Progress rows: ${progressRows.length}`);

    await insertInBatches(prisma, "progress", progressRows, (r) => ({
      id: r.id,
      userId: r.userId,
      lessonId: r.lessonId,
      completed: asBool(r.completed),
      quizScore: r.quizScore ?? null,
      quizAttempts: r.quizAttempts,
      quizPassed: asBool(r.quizPassed),
      completedAt: asDate(r.completedAt),
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    // 6) Submission
    console.log("Reading SQLite: Submission...");
    const submissionRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "Submission" ORDER BY "userId" ASC, "lessonId" ASC, "blockId" ASC;`
    );
    console.log(`Submission rows: ${submissionRows.length}`);

    await insertInBatches(prisma, "submission", submissionRows, (r) => ({
      id: r.id,
      userId: r.userId,
      lessonId: r.lessonId,
      blockId: r.blockId,
      answer: r.answer,
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    // 7) StudentContentVisibility
    console.log("Reading SQLite: StudentContentVisibility...");
    const scvRows = execSqliteJson(
      sqlitePath,
      `SELECT * FROM "StudentContentVisibility" ORDER BY "studentId" ASC;`
    );
    console.log(`StudentContentVisibility rows: ${scvRows.length}`);

    await insertInBatches(prisma, "studentContentVisibility", scvRows, (r) => ({
      id: r.id,
      studentId: r.studentId,
      moduleId: r.moduleId ?? null,
      lessonId: r.lessonId ?? null,
      visible: asBool(r.visible),
      createdAt: asDate(r.createdAt),
      updatedAt: asDate(r.updatedAt),
    }));

    console.log("Migration complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});

